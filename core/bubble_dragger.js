/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2018 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Methods for dragging a bubble visually.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

goog.provide('Blockly.BubbleDragger');

goog.require('goog.math.Coordinate');
goog.require('goog.asserts');


/**
 * Class for a bubble dragger.  It moves bubbles around the workspace when they
 * are being dragged by a mouse or touch.
 * @param {!Blockly.Bubble} bubble The bubble to drag.
 * @param {!Blockly.WorkspaceSvg} workspace The workspace to drag on.
 * @constructor
 */
Blockly.BubbleDragger = function(bubble, workspace) {
  /**
   * The bubble that is being dragged.
   * @type {!Blockly.Bubble}
   * @private
   */
  this.draggingBubble_ = bubble;

  /**
   * The workspace on which the bubble is being dragged.
   * @type {!Blockly.WorkspaceSvg}
   * @private
   */
  this.workspace_ = workspace;

  /**
   * The location of the top left corner of the dragging bubble at the beginning
   * of the drag in workspace coordinates.
   * @type {!goog.math.Coordinate}
   * @private
   */
  this.startXY_ = this.draggingBubble_.getRelativeToSurfaceXY();

  // TODO: validate, getters, etc.
  this.dragSurface_ =
      Blockly.utils.is3dSupported() && !!workspace.blockDragSurface_ ?
      workspace.blockDragSurface_ : null;
};

/**
 * Sever all links from this object.
 * @package
 */
Blockly.BubbleDragger.prototype.dispose = function() {
  this.draggingBubble_ = null;
  this.workspace_ = null;
  this.startWorkspace_ = null;
};

/**
 * Start dragging a block.  This includes moving it to the drag surface.
 * @package
 */
Blockly.BubbleDragger.prototype.startBubbleDrag = function() {
  if (!Blockly.Events.getGroup()) {
    Blockly.Events.setGroup(true);
  }

  this.workspace_.setResizesEnabled(false);
  this.draggingBubble_.moveToDragSurface(this.dragSurface_);
};

/**
 * Execute a step of block dragging, based on the given event.  Update the
 * display accordingly.
 * @param {!Event} e The most recent move event.
 * @param {!goog.math.Coordinate} currentDragDeltaXY How far the pointer has
 *     moved from the position at the start of the drag, in pixel units.
 * @package
 */
Blockly.BubbleDragger.prototype.dragBubble = function(e, currentDragDeltaXY) {
  var delta = this.pixelsToWorkspaceUnits_(currentDragDeltaXY);
  var newLoc = goog.math.Coordinate.sum(this.startXY_, delta);

  this.draggingBubble_.moveDuringDrag(this.dragSurface_, newLoc);
  // TODO (fenichel): Possibly update the cursor if dragging to the trash can
  // is allowed.
};

/**
 * Finish a block drag and put the block back on the workspace.
 * @param {!Event} e The mouseup/touchend event.
 * @param {!goog.math.Coordinate} currentDragDeltaXY How far the pointer has
 *     moved from the position at the start of the drag, in pixel units.
 * @package
 */
Blockly.BubbleDragger.prototype.endBubbleDrag = function(e, currentDragDeltaXY) {
  // Make sure internal state is fresh.
  this.dragBubble(e, currentDragDeltaXY);

  var delta = this.pixelsToWorkspaceUnits_(currentDragDeltaXY);
  var newLoc = goog.math.Coordinate.sum(this.startXY_, delta);
  this.draggingBubble_.moveOffDragSurface(this.dragSurface_, newLoc);

  this.fireMoveEvent_();
  this.workspace_.setResizesEnabled(true);

  Blockly.Events.setGroup(false);
};

/**
 * Fire a move event at the end of a block drag.
 * @private
 */
Blockly.BubbleDragger.prototype.fireMoveEvent_ = function() {
  // TODO: move events for comments.
  return;
};

/**
 * Convert a coordinate object from pixels to workspace units, including a
 * correction for mutator workspaces.
 * This function does not consider differing origins.  It simply scales the
 * input's x and y values.
 * @param {!goog.math.Coordinate} pixelCoord A coordinate with x and y values
 *     in css pixel units.
 * @return {!goog.math.Coordinate} The input coordinate divided by the workspace
 *     scale.
 * @private
 */
Blockly.BubbleDragger.prototype.pixelsToWorkspaceUnits_ = function(pixelCoord) {
  var result = new goog.math.Coordinate(pixelCoord.x / this.workspace_.scale,
      pixelCoord.y / this.workspace_.scale);
  if (this.workspace_.isMutator) {
    // If we're in a mutator, its scale is always 1, purely because of some
    // oddities in our rendering optimizations.  The actual scale is the same as
    // the scale on the parent workspace.
    // Fix that for dragging.
    var mainScale = this.workspace_.options.parentWorkspace.scale;
    result = result.scale(1 / mainScale);
  }
  return result;
};
