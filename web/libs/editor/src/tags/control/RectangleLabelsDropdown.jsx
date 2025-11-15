import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { LabelsModel } from "./Labels/Labels";
import { HtxLabelsDropdown } from "./Labels/LabelsDropdown";
import { RectangleModel } from "./Rectangle";
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";

/**
 * The `RectangleLabelsDropdown` tag creates labeled rectangles with a dropdown selector. Use to apply labels to bounding box semantic segmentation tasks with a dropdown interface.
 *
 * Use with the following data types: image. Annotation results store the left top corner of the bounding box,
 * read more about it and rotation in the [Object Detection Template](/templates/image_bbox.html#Bounding-box-rotation-in-the-Label-Studio-results).
 *
 * @example
 * <!--Basic labeling configuration for applying labels to rectangular bounding boxes on an image using dropdown -->
 * <View>
 *   <RectangleLabelsDropdown name="labels" toName="image">
 *     <Label value="Person" />
 *     <Label value="Animal" />
 *   </RectangleLabelsDropdown>
 *   <Image name="image" value="$image" />
 * </View>
 * @name RectangleLabelsDropdown
 * @regions RectRegion
 * @meta_title Rectangle Label Dropdown Tag to Label Rectangle Bounding Box in Images
 * @meta_description Customize Label Studio with the RectangleLabelsDropdown tag and add labeled rectangle bounding boxes in images using a dropdown selector for semantic segmentation and object detection machine learning and data science projects.
 * @param {string} name              - Name of the element
 * @param {string} toName            - Name of the image to label
 * @param {single|multiple=} [choice=single] - Configure whether you can select one or multiple labels
 * @param {number} [maxUsages]               - Maximum number of times a label can be used per task
 * @param {float} [opacity=0.6]      - Opacity of rectangle
 * @param {string} [fillColor]       - Rectangle fill color in hexadecimal
 * @param {string} [strokeColor]     - Stroke color in hexadecimal
 * @param {number} [strokeWidth=1]   - Width of stroke
 * @param {boolean} [canRotate=true] - Show or hide rotation control. Note that the anchor point in the results is different than the anchor point used when rotating with the rotation tool. For more information, see [Rotation](/templates/image_bbox#Rotation).
 */

const Validation = types.model({
  controlledTags: Types.unionTag(["Image"]),
});

const ModelAttrs = types.model("RectangleLabelsDropdownModel", {
  pid: types.optional(types.string, guidGenerator),
  type: "rectanglelabelsdropdown",
  children: Types.unionArray(["label", "header", "view", "hypertext"]),
});

const Composition = types.compose(
  ControlBase,
  LabelsModel,
  ModelAttrs,
  RectangleModel,
  Validation,
  LabelMixin,
  SelectedModelMixin.props({ _child: "LabelModel" }),
);

const RectangleLabelsDropdownModel = types.compose("RectangleLabelsDropdownModel", Composition);

const HtxRectangleLabelsDropdown = observer(({ item }) => {
  return <HtxLabelsDropdown item={item} />;
});

Registry.addTag("rectanglelabelsdropdown", RectangleLabelsDropdownModel, HtxRectangleLabelsDropdown);

export { HtxRectangleLabelsDropdown, RectangleLabelsDropdownModel };
