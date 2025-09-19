## Project Structure


## IMPORTANT INSTRUCTION

NEVER use inline import example:  const { OCRWordDetection } = require("../utils/ocrWordDetection");
use must always import it at the top import { OCRWordDetection } from "../utils/ocrWordDetection" 


```
.├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── LSF.init.md
├── README.md
├── __mocks__
│   └── global.ts
├── codecov.yml
├── cypress.config.ts
├── images
├── jest.config.js
├── jest.setup.js
├── nyc.config.js
├── package.json
├── project.json
├── scripts
│   ├── copy.sh
│   ├── create-docs.js
│   └── publish.sh
├── src
│   ├── Component.jsx
│   ├── LabelStudio.tsx
│   ├── assets
│   │   └── styles
│   │       ├── _functions.scss
│   │       ├── _mixins.scss
│   │       ├── _variables.scss
│   │       ├── antd-no-reset.css
│   │       └── global.scss
│   ├── common
│   │   ├── Button
│   │   │   ├── Button.scss
│   │   │   └── Button.tsx
│   │   ├── Dropdown
│   │   │   ├── Dropdown.scss
│   │   │   ├── Dropdown.ts
│   │   │   ├── DropdownComponent.tsx
│   │   │   ├── DropdownContext.tsx
│   │   │   └── DropdownTrigger.tsx
│   │   ├── Icon
│   │   │   ├── Icon.jsx
│   │   │   └── Icon.scss
│   │   ├── Input
│   │   │   ├── Input.jsx
│   │   │   └── Input.scss
│   │   ├── Label
│   │   │   ├── Label.jsx
│   │   │   └── Label.scss
│   │   ├── Menu
│   │   │   ├── Menu.jsx
│   │   │   ├── Menu.scss
│   │   │   ├── MenuContext.js
│   │   │   └── MenuItem.jsx
│   │   ├── Modal
│   │   │   ├── Modal.jsx
│   │   │   ├── Modal.scss
│   │   │   └── ModalPopup.jsx
│   │   ├── Pagination
│   │   │   ├── Pagination.scss
│   │   │   └── Pagination.tsx
│   │   ├── RadioGroup
│   │   │   ├── RadioGroup.jsx
│   │   │   └── RadioGroup.scss
│   │   ├── Range
│   │   │   ├── Range.scss
│   │   │   └── Range.tsx
│   │   ├── Space
│   │   │   ├── Space.scss
│   │   │   └── Space.tsx
│   │   ├── TextArea
│   │   │   ├── TextArea.scss
│   │   │   └── TextArea.tsx
│   │   ├── TimeAgo
│   │   │   └── TimeAgo.tsx
│   │   └── Utils
│   │       ├── mergeRefs.ts
│   │       ├── useMounted.ts
│   │       ├── useValueTracker.ts
│   │       └── useWindowSize.ts
│   ├── components
│   │   ├── AnnotationTab
│   │   │   ├── AutoAcceptToggle.jsx
│   │   │   ├── AutoAcceptToggle.scss
│   │   │   ├── DynamicPreannotationsToggle.jsx
│   │   │   └── DynamicPreannotationsToggle.scss
│   │   ├── AnnotationTabs
│   │   │   ├── AnnotationTabs.jsx
│   │   │   └── AnnotationTabs.scss
│   │   ├── Annotations
│   │   │   ├── Annotations.jsx
│   │   │   └── Annotations.module.scss
│   │   ├── AnnotationsCarousel
│   │   │   ├── AnnotationButton.scss
│   │   │   ├── AnnotationButton.tsx
│   │   │   ├── AnnotationsCarousel.scss
│   │   │   └── AnnotationsCarousel.tsx
│   │   ├── App
│   │   │   ├── Annotation.js
│   │   │   ├── App.jsx
│   │   │   ├── App.scss
│   │   │   ├── Grid.jsx
│   │   │   ├── Grid.module.scss
│   │   │   ├── ViewAll.module.scss
│   │   │   └── ViewAll.tsx
│   │   ├── BottomBar
│   │   │   ├── Actions.jsx
│   │   │   ├── BottomBar.jsx
│   │   │   ├── BottomBar.scss
│   │   │   ├── Controls.scss
│   │   │   ├── Controls.tsx
│   │   │   ├── CurrentTask.jsx
│   │   │   ├── CurrentTask.scss
│   │   │   ├── HistoryActions.jsx
│   │   │   ├── HistoryActions.scss
│   │   │   ├── __tests__
│   │   │   │   ├── Controls.test.tsx
│   │   │   │   └── CurrentTask.test.tsx
│   │   │   └── buttons.tsx
│   │   ├── Choice
│   │   │   ├── Choice.jsx
│   │   │   └── Choice.module.scss
│   │   ├── Comments
│   │   │   ├── Comment
│   │   │   │   ├── CommentForm.scss
│   │   │   │   ├── CommentForm.tsx
│   │   │   │   ├── CommentFormButtons.scss
│   │   │   │   ├── CommentFormButtons.tsx
│   │   │   │   ├── CommentItem.scss
│   │   │   │   ├── CommentItem.tsx
│   │   │   │   ├── CommentsList.tsx
│   │   │   │   ├── LinkState.scss
│   │   │   │   └── LinkState.tsx
│   │   │   ├── CommentFormBase.tsx
│   │   │   ├── Comments.scss
│   │   │   ├── Comments.tsx
│   │   │   └── OldComment
│   │   │       ├── CommentForm.scss
│   │   │       ├── CommentForm.tsx
│   │   │       ├── CommentItem.scss
│   │   │       ├── CommentItem.tsx
│   │   │       └── CommentsList.tsx
│   │   ├── ContextMenu
│   │   │   ├── ContextMenu.module.scss
│   │   │   ├── ContextMenu.tsx
│   │   │   └── index.ts
│   │   ├── Controls
│   │   │   ├── Controls.jsx
│   │   │   └── Controls.module.scss
│   │   ├── CurrentEntity
│   │   │   ├── AnnotationHistory.scss
│   │   │   ├── AnnotationHistory.tsx
│   │   │   ├── GroundTruth.jsx
│   │   │   └── GroundTruth.scss
│   │   ├── Debug.jsx
│   │   ├── Dialog
│   │   │   ├── Dialog.jsx
│   │   │   └── Dialog.module.scss
│   │   ├── DraftPanel
│   │   │   ├── DraftPanel.jsx
│   │   │   └── DraftPanel.scss
│   │   ├── ErrorMessage
│   │   │   ├── ErrorMessage.jsx
│   │   │   └── ErrorMessage.module.scss
│   │   ├── Hint
│   │   │   ├── Hint.module.scss
│   │   │   ├── Hint.scss
│   │   │   └── Hint.tsx
│   │   ├── HtxTextBox
│   │   │   ├── HtxTextBox.jsx
│   │   │   └── HtxTextBox.module.scss
│   │   ├── ImageGrid
│   │   │   └── ImageGrid.jsx
│   │   ├── ImageTransformer
│   │   │   ├── ImageTransformer.jsx
│   │   │   ├── LSTransformer.js
│   │   │   └── LSTransformerOld.js
│   │   ├── ImageView
│   │   │   ├── Image.jsx
│   │   │   ├── Image.scss
│   │   │   ├── ImageView.jsx
│   │   │   ├── ImageView.module.scss
│   │   │   ├── ImageViewContext.ts
│   │   │   ├── LabelOnRegion.jsx
│   │   │   └── SuggestionControls.jsx
│   │   ├── Infomodal
│   │   │   └── Infomodal.js
│   │   ├── InstructionsModal
│   │   │   ├── InstructionsModal.tsx
│   │   │   └── __tests__
│   │   │       └── InstructionsModal.test.tsx
│   │   ├── InteractiveOverlays
│   │   │   ├── BoundingBox.js
│   │   │   ├── CommentsOverlay.module.scss
│   │   │   ├── CommentsOverlay.tsx
│   │   │   ├── Geometry.js
│   │   │   ├── NodesConnector.js
│   │   │   ├── RelationShape.js
│   │   │   ├── RelationsOverlay.jsx
│   │   │   ├── RelationsOverlay.module.scss
│   │   │   └── watchers
│   │   │       ├── DOMWatcher.js
│   │   │       ├── PropertyWatcher.js
│   │   │       └── index.js
│   │   ├── Label
│   │   │   ├── Label.jsx
│   │   │   └── Label.scss
│   │   ├── NewTaxonomy
│   │   │   ├── NewTaxonomy.scss
│   │   │   ├── NewTaxonomy.tsx
│   │   │   ├── TaxonomySearch.scss
│   │   │   └── TaxonomySearch.tsx
│   │   ├── Node
│   │   │   ├── Node.scss
│   │   │   ├── Node.tsx
│   │   │   └── NodeView.ts
│   │   ├── Panel
│   │   │   ├── Panel.jsx
│   │   │   └── Panel.module.scss
│   │   ├── Ranker
│   │   │   ├── Column.tsx
│   │   │   ├── Item.tsx
│   │   │   ├── Ranker.module.scss
│   │   │   ├── Ranker.tsx
│   │   │   ├── StrictModeDroppable.tsx
│   │   │   └── createData.ts
│   │   ├── Segment
│   │   │   ├── Segment.jsx
│   │   │   └── Segment.module.scss
│   │   ├── Settings
│   │   │   ├── Settings.jsx
│   │   │   ├── Settings.scss
│   │   │   └── TagSettings
│   │   │       ├── SettingsRenderer.tsx
│   │   │       ├── Types.ts
│   │   │       ├── VideoSettings.tsx
│   │   │       └── index.ts
│   │   ├── SidePanels
│   │   │   ├── Components
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── LockButton.tsx
│   │   │   │   ├── RegionContextMenu.tsx
│   │   │   │   ├── RegionControlButton.tsx
│   │   │   │   └── __tests__
│   │   │   │       └── EmptyState.test.tsx
│   │   │   ├── DetailsPanel
│   │   │   │   ├── DetailsPanel.scss
│   │   │   │   ├── DetailsPanel.tsx
│   │   │   │   ├── RegionDetails.scss
│   │   │   │   ├── RegionDetails.tsx
│   │   │   │   ├── RegionEditor.scss
│   │   │   │   ├── RegionEditor.tsx
│   │   │   │   ├── RegionItem.tsx
│   │   │   │   ├── RegionLabels.tsx
│   │   │   │   ├── Relations.scss
│   │   │   │   ├── Relations.tsx
│   │   │   │   ├── RelationsControls.scss
│   │   │   │   ├── RelationsControls.tsx
│   │   │   │   ├── TimelineRegionEditor.module.scss
│   │   │   │   ├── TimelineRegionEditor.tsx
│   │   │   │   └── __tests__
│   │   │   │       └── DetailsPanel.test.tsx
│   │   │   ├── OutlinerPanel
│   │   │   │   ├── OutlinerPanel.scss
│   │   │   │   ├── OutlinerPanel.tsx
│   │   │   │   ├── OutlinerTree.tsx
│   │   │   │   ├── RegionLabel.tsx
│   │   │   │   ├── TreeView.scss
│   │   │   │   ├── ViewControls.scss
│   │   │   │   ├── ViewControls.tsx
│   │   │   │   └── __tests__
│   │   │   │       └── OutlinerPanel.test.tsx
│   │   │   ├── PanelBase.scss
│   │   │   ├── PanelBase.tsx
│   │   │   ├── SidePanels.scss
│   │   │   ├── SidePanels.tsx
│   │   │   ├── SidePanelsContext.ts
│   │   │   ├── TabPanels
│   │   │   │   ├── PanelTabsBase.scss
│   │   │   │   ├── PanelTabsBase.tsx
│   │   │   │   ├── SideTabsPanels.tsx
│   │   │   │   ├── Tabs.scss
│   │   │   │   ├── Tabs.tsx
│   │   │   │   ├── __tests__
│   │   │   │   │   └── utils.test.tsx
│   │   │   │   ├── types.ts
│   │   │   │   └── utils.ts
│   │   │   └── constants.ts
│   │   ├── SimpleBadge
│   │   │   ├── SimpleBadge.jsx
│   │   │   └── SimpleBadge.module.scss
│   │   ├── Tags
│   │   │   └── Object.tsx
│   │   ├── TaskSummary
│   │   │   ├── DataSummary.tsx
│   │   │   ├── LabelingSummary.tsx
│   │   │   ├── NumbersSummary.tsx
│   │   │   ├── ResizeHandler.tsx
│   │   │   ├── SummaryBadge.tsx
│   │   │   ├── TaskSummary.test.tsx
│   │   │   ├── TaskSummary.tsx
│   │   │   ├── labelings.tsx
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── Taxonomy
│   │   │   ├── Taxonomy.module.scss
│   │   │   └── Taxonomy.tsx
│   │   ├── TextHighlight
│   │   │   ├── EmojiNode.jsx
│   │   │   ├── Node.jsx
│   │   │   ├── Range.js
│   │   │   ├── TextHighlight.jsx
│   │   │   ├── TextHighlight.module.scss
│   │   │   └── UrlNode.jsx
│   │   ├── TextNode
│   │   │   └── TextNode.jsx
│   │   ├── TimeDurationControl
│   │   │   ├── TimeBox.scss
│   │   │   ├── TimeBox.tsx
│   │   │   ├── TimeDurationControl.scss
│   │   │   └── TimeDurationControl.tsx
│   │   ├── TimeSeries
│   │   │   └── TimeSeriesVisualizer.jsx
│   │   ├── Timeline
│   │   │   ├── Context.ts
│   │   │   ├── Controls
│   │   │   │   ├── AudioControl.scss
│   │   │   │   ├── AudioControl.tsx
│   │   │   │   ├── ConfigControl.scss
│   │   │   │   ├── ConfigControl.tsx
│   │   │   │   ├── Slider.scss
│   │   │   │   ├── Slider.tsx
│   │   │   │   ├── SpectrogramControl.scss
│   │   │   │   └── SpectrogramControl.tsx
│   │   │   ├── Controls.scss
│   │   │   ├── Controls.tsx
│   │   │   ├── Plugins
│   │   │   │   └── Timeline.tsx
│   │   │   ├── Seeker.scss
│   │   │   ├── Seeker.tsx
│   │   │   ├── SideControls
│   │   │   │   ├── FramesControl.scss
│   │   │   │   ├── FramesControl.tsx
│   │   │   │   ├── VolumeControl.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Timeline.scss
│   │   │   ├── Timeline.tsx
│   │   │   ├── Types.ts
│   │   │   └── Views
│   │   │       ├── Frames
│   │   │       │   ├── Controls.tsx
│   │   │       │   ├── Frames.scss
│   │   │       │   ├── Frames.tsx
│   │   │       │   ├── Keypoints.scss
│   │   │       │   ├── Keypoints.tsx
│   │   │       │   ├── Minimap.scss
│   │   │       │   ├── Minimap.tsx
│   │   │       │   ├── Utils.ts
│   │   │       │   └── index.ts
│   │   │       ├── Wave
│   │   │       │   ├── Utils.ts
│   │   │       │   ├── Wave.scss
│   │   │       │   ├── Wave.tsx
│   │   │       │   └── index.ts
│   │   │       └── index.ts
│   │   ├── Toolbar
│   │   │   ├── FlyoutMenu.jsx
│   │   │   ├── FlyoutMenu.scss
│   │   │   ├── Tool.jsx
│   │   │   ├── Tool.scss
│   │   │   ├── Toolbar.jsx
│   │   │   ├── Toolbar.scss
│   │   │   └── ToolbarContext.js
│   │   ├── Tools
│   │   │   ├── Basic.jsx
│   │   │   ├── Slider.jsx
│   │   │   ├── SliderDropDown.jsx
│   │   │   └── Styles.module.scss
│   │   ├── TopBar
│   │   │   ├── Actions.jsx
│   │   │   ├── Annotations.jsx
│   │   │   ├── Annotations.scss
│   │   │   ├── Controls.jsx
│   │   │   ├── Controls.scss
│   │   │   ├── CurrentTask.jsx
│   │   │   ├── CurrentTask.scss
│   │   │   ├── HistoryActions.jsx
│   │   │   ├── HistoryActions.scss
│   │   │   ├── TopBar.jsx
│   │   │   ├── TopBar.scss
│   │   │   └── __tests__
│   │   │       └── CurrentTask.test.tsx
│   │   ├── TreeStructure
│   │   │   └── TreeStructure.tsx
│   │   ├── TreeValidation
│   │   │   └── TreeValidation.jsx
│   │   ├── VideoCanvas
│   │   │   ├── VideoCanvas.scss
│   │   │   ├── VideoCanvas.tsx
│   │   │   ├── VideoConstants.ts
│   │   │   ├── VirtualCanvas.tsx
│   │   │   ├── VirtualVideo.tsx
│   │   │   └── __tests__
│   │   │       └── VirtualVideo.test.tsx
│   │   └── Waveform
│   │       ├── Waveform.jsx
│   │       └── Waveform.module.scss
│   ├── configureStore.js
│   ├── core
│   │   ├── Constants.ts
│   │   ├── CustomTypes.ts
│   │   ├── DataValidator
│   │   │   ├── ConfigValidator.js
│   │   │   └── index.js
│   │   ├── External.js
│   │   ├── Helpers.ts
│   │   ├── Hotkey.ts
│   │   ├── Registry.ts
│   │   ├── TimeTraveller.js
│   │   ├── Tree.tsx
│   │   ├── Types.js
│   │   ├── __tests__
│   │   │   ├── ConfigValidator.test.js
│   │   │   └── repeater.test.js
│   │   ├── feature-flags
│   │   │   ├── flags.json
│   │   │   └── index.ts
│   │   └── settings
│   │       ├── editorsettings.js
│   │       ├── keymap.json
│   │       ├── types.ts
│   │       └── videosettings.ts
│   ├── defaultOptions.js
│   ├── env
│   │   ├── development.js
│   │   └── production.js
│   ├── examples
│   │   ├── audio_classification
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   ├── 0.json
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── audio_regions
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── audio_video_paragraphs
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── classification_mixed
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── datetime
│   │   │   ├── config.xml
│   │   │   └── index.js
│   │   ├── dialogue_analysis
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── html_document
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── image_bbox
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── image_bbox_large
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── image_classification
│   │   │   └── config.xml
│   │   ├── image_ellipses
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── image_keypoints
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 0.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── image_list
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.ts
│   │   │   └── tasks.json
│   │   ├── image_list_large
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.ts
│   │   │   └── tasks.json
│   │   ├── image_list_perregion
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.ts
│   │   │   └── tasks.json
│   │   ├── image_magic_wand
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── gcp_cors_config.json
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── image_multilabel
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── image_ocr
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── image_polygons
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 0.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── image_segmentation
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── image_tools
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── named_entity
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── nested_choices
│   │   │   ├── annotations
│   │   │   │   └── 0.json
│   │   │   ├── complicated.js
│   │   │   ├── config-complicated.xml
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── pairwise
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── phrases
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── ranker
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── ranker_buckets
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── references
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── repeater
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── required
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── rich_text_html
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── rich_text_plain
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── rich_text_plain_remote
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── sentiment_analysis
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   ├── 0.json
│   │   │   │   ├── 1.json
│   │   │   │   ├── 2.json
│   │   │   │   └── 3.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── table
│   │   │   ├── annotations
│   │   │   │   └── 0.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── table_csv
│   │   │   ├── annotations
│   │   │   │   └── 0.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── taxonomy
│   │   │   ├── annotations
│   │   │   │   └── 0.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── taxonomy_large
│   │   │   ├── annotations
│   │   │   │   └── 0.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── taxonomy_large_inline
│   │   │   ├── annotations
│   │   │   │   └── 0.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── timeseries
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── sample-sin.json
│   │   ├── timeseries_single
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   ├── sample-sin.json
│   │   │   └── tasks.json
│   │   ├── transcribe_audio
│   │   │   ├── START.md
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── video
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   ├── video_audio
│   │   │   ├── annotations
│   │   │   │   └── 1.json
│   │   │   ├── config.xml
│   │   │   ├── index.js
│   │   │   └── tasks.json
│   │   └── video_bboxes
│   │       ├── annotations
│   │       │   └── 1.json
│   │       ├── config.xml
│   │       ├── index.js
│   │       └── tasks.json
│   ├── hooks
│   │   ├── useDrag.ts
│   │   ├── useFullscreen.ts
│   │   ├── useHotkey.ts
│   │   ├── useLocalStorageState.ts
│   │   ├── useMedia.ts
│   │   ├── useMemoizedHandlers.ts
│   │   ├── useRegionColor.ts
│   │   ├── useRegionsCopyPaste.ts
│   │   └── useToggle.ts
│   ├── index.js
│   ├── lib
│   │   └── AudioUltra
│   │       ├── Analysis
│   │       │   ├── FFTProcessor.ts
│   │       │   └── MelBanks.ts
│   │       ├── Common
│   │       │   ├── Cacheable.ts
│   │       │   ├── Color.ts
│   │       │   ├── Destructable.ts
│   │       │   ├── Events.ts
│   │       │   ├── LRUCache.ts
│   │       │   ├── Style.ts
│   │       │   ├── Utils.ts
│   │       │   └── Worker
│   │       │       ├── ComputationQueue.ts
│   │       │       ├── ComputationWorkerQueue.ts
│   │       │       └── index.ts
│   │       ├── Controls
│   │       │   ├── Html5Player.ts
│   │       │   ├── Player.ts
│   │       │   └── WebAudioPlayer.ts
│   │       ├── Cursor
│   │       │   └── Cursor.ts
│   │       ├── Media
│   │       │   ├── AudioDecoder.ts
│   │       │   ├── AudioDecoderPool.ts
│   │       │   ├── BaseAudioDecoder.ts
│   │       │   ├── MediaLoader.ts
│   │       │   ├── SplitChannel.ts
│   │       │   ├── SplitChannelWorker.ts
│   │       │   ├── WaveformAudio.ts
│   │       │   └── WebAudioDecoder.ts
│   │       ├── Regions
│   │       │   ├── Region.ts
│   │       │   ├── Regions.ts
│   │       │   └── Segment.ts
│   │       ├── Timeline
│   │       │   └── Timeline.ts
│   │       ├── Tooltip
│   │       │   └── Tooltip.ts
│   │       ├── Visual
│   │       │   ├── ColorMapper.ts
│   │       │   ├── Composition
│   │       │   │   ├── LayerComposer.ts
│   │       │   │   └── LayerM.ts
│   │       │   ├── Layer.ts
│   │       │   ├── LayerGroup.ts
│   │       │   ├── Loader.ts
│   │       │   ├── PlayHead.ts
│   │       │   ├── Renderer
│   │       │   │   ├── Downsampler.ts
│   │       │   │   ├── Plugins
│   │       │   │   │   ├── GridRendererPlugin.ts
│   │       │   │   │   ├── ProgressRendererPlugin.ts
│   │       │   │   │   └── RendererPlugin.ts
│   │       │   │   ├── RateLimitedRenderer.ts
│   │       │   │   ├── Renderer.ts
│   │       │   │   ├── SpectrogramRenderer.ts
│   │       │   │   └── WaveformRenderer.ts
│   │       │   ├── Visualizer.ts
│   │       │   ├── WindowFunctions.ts
│   │       │   └── constants.ts
│   │       ├── Waveform.ts
│   │       ├── hooks
│   │       │   └── useSpectrogramControls.ts
│   │       ├── index.ts
│   │       └── react
│   │           ├── ConfigControl.tsx
│   │           ├── SpectrogramConfig.tsx
│   │           └── index.ts
│   ├── mixins
│   │   ├── AnnotationMixin.js
│   │   ├── AreaMixin.js
│   │   ├── DrawingTool.js
│   │   ├── DynamicChildrenMixin.js
│   │   ├── HighlightMixin.js
│   │   ├── IsReadyMixin.js
│   │   ├── KonvaRegion.js
│   │   ├── LabelMixin.js
│   │   ├── LeadTime.ts
│   │   ├── Normalization.ts
│   │   ├── PerItem.js
│   │   ├── PerRegion.js
│   │   ├── PerRegionModes.ts
│   │   ├── PersistentState.js
│   │   ├── ProcessAttrs.js
│   │   ├── ReadOnlyMixin.js
│   │   ├── Regions.js
│   │   ├── Required.js
│   │   ├── SelectedChoiceMixin.js
│   │   ├── SelectedModel.js
│   │   ├── SeparatedControlMixin.js
│   │   ├── SharedChoiceStore
│   │   │   ├── extender.js
│   │   │   ├── mixin.js
│   │   │   └── model.js
│   │   ├── SpanText.js
│   │   ├── Syncable.ts
│   │   ├── TagParentMixin.js
│   │   ├── Tool.js
│   │   ├── ToolManagerMixin.js
│   │   └── Visibility.js
│   ├── react-app-env.d.ts
│   ├── regions
│   │   ├── AliveRegion.tsx
│   │   ├── Area.js
│   │   ├── AudioRegion
│   │   │   ├── AudioRegionModel.js
│   │   │   └── AudioUltraRegionModel.js
│   │   ├── AudioRegion.js
│   │   ├── BrushRegion.jsx
│   │   ├── EditableRegion.js
│   │   ├── EllipseRegion.jsx
│   │   ├── HyperTextRegion
│   │   │   └── HyperTextRegion.module.scss
│   │   ├── HyperTextRegion.js
│   │   ├── ImageRegion.js
│   │   ├── KeyPointRegion.jsx
│   │   ├── ParagraphsRegion.js
│   │   ├── PolygonPoint.jsx
│   │   ├── PolygonRegion.jsx
│   │   ├── RectRegion.jsx
│   │   ├── RegionWrapper.jsx
│   │   ├── Result.js
│   │   ├── RichTextRegion.js
│   │   ├── Test.js
│   │   ├── TextAreaRegion
│   │   │   └── TextAreaRegion.scss
│   │   ├── TextAreaRegion.jsx
│   │   ├── TextRegion
│   │   │   └── TextRegion.module.scss
│   │   ├── TextRegion.js
│   │   ├── TimeSeriesRegion.js
│   │   ├── TimelineRegion.js
│   │   ├── VideoRectangleRegion.js
│   │   ├── VideoRegion.js
│   │   └── index.js
│   ├── serviceWorker.js
│   ├── setupTests.js
│   ├── standalone.js
│   ├── stores
│   │   ├── Annotation
│   │   │   ├── Annotation.js
│   │   │   ├── HistoryItem.js
│   │   │   ├── LinkingModes
│   │   │   │   ├── CommentMode.js
│   │   │   │   └── RelationMode.js
│   │   │   ├── LinkingModes.js
│   │   │   └── store.js
│   │   ├── AppStore.js
│   │   ├── Comment
│   │   │   ├── Anchor.js
│   │   │   ├── Comment.js
│   │   │   └── CommentStore.js
│   │   ├── CustomButton.ts
│   │   ├── ProjectStore.js
│   │   ├── RegionStore.js
│   │   ├── RelationStore.js
│   │   ├── SettingsStore.js
│   │   ├── TaskStore.js
│   │   ├── UserLabels.ts
│   │   ├── UserStore.js
│   │   ├── __tests__
│   │   │   └── TaskStore.test.js
│   │   └── types.d.ts
│   ├── styles
│   │   └── global.module.scss
│   ├── tags
│   │   ├── TagBase.js
│   │   ├── control
│   │   │   ├── Base.js
│   │   │   ├── Brush.js
│   │   │   ├── BrushLabels.jsx
│   │   │   ├── Choice
│   │   │   │   └── Choice.scss
│   │   │   ├── Choice.jsx
│   │   │   ├── Choices
│   │   │   │   └── Choices.scss
│   │   │   ├── Choices.jsx
│   │   │   ├── ClassificationBase.js
│   │   │   ├── DateTime.jsx
│   │   │   ├── Ellipse.js
│   │   │   ├── EllipseLabels.jsx
│   │   │   ├── HyperTextLabels.jsx
│   │   │   ├── KeyPoint.js
│   │   │   ├── KeyPointLabels.jsx
│   │   │   ├── Label.jsx
│   │   │   ├── Labels
│   │   │   │   ├── Labels.jsx
│   │   │   │   └── Labels.scss
│   │   │   ├── MagicWand.js
│   │   │   ├── Number.jsx
│   │   │   ├── Pairwise.js
│   │   │   ├── ParagraphLabels.jsx
│   │   │   ├── Polygon.js
│   │   │   ├── PolygonLabels.jsx
│   │   │   ├── Ranker.jsx
│   │   │   ├── Rating.jsx
│   │   │   ├── Rectangle.js
│   │   │   ├── RectangleLabels.jsx
│   │   │   ├── Relation.js
│   │   │   ├── Relations.js
│   │   │   ├── Shortcut.jsx
│   │   │   ├── Taxonomy
│   │   │   │   ├── Taxonomy.jsx
│   │   │   │   └── Taxonomy.scss
│   │   │   ├── TextArea
│   │   │   │   ├── TextArea.jsx
│   │   │   │   ├── TextArea.scss
│   │   │   │   └── TextAreaRegionView.jsx
│   │   │   ├── TimeSeriesLabels.jsx
│   │   │   ├── TimelineLabels.js
│   │   │   ├── VideoRectangle.js
│   │   │   ├── __tests__
│   │   │   │   └── Ranker.test.ts
│   │   │   └── index.js
│   │   ├── object
│   │   │   ├── Base.js
│   │   │   ├── HyperText.js
│   │   │   ├── Image
│   │   │   │   ├── DrawingRegion.js
│   │   │   │   ├── Image.js
│   │   │   │   ├── ImageEntity.js
│   │   │   │   ├── ImageEntityMixin.js
│   │   │   │   ├── ImageSelection.js
│   │   │   │   ├── ImageSelectionPoint.js
│   │   │   │   └── index.js
│   │   │   ├── List.jsx
│   │   │   ├── MultiItemObjectBase.js
│   │   │   ├── PagedView.jsx
│   │   │   ├── Paragraphs
│   │   │   │   ├── AuthorFilter.jsx
│   │   │   │   ├── HtxParagraphs.jsx
│   │   │   │   ├── Paragraphs.module.scss
│   │   │   │   ├── Phrases.jsx
│   │   │   │   ├── __tests__
│   │   │   │   │   ├── Phrases.test.tsx
│   │   │   │   │   └── model.test.ts
│   │   │   │   ├── index.js
│   │   │   │   └── model.js
│   │   │   ├── Pdf.jsx
│   │   │   ├── RichText
│   │   │   │   ├── RichText.scss
│   │   │   │   ├── domManager.md
│   │   │   │   ├── domManager.ts
│   │   │   │   ├── index.js
│   │   │   │   ├── model.js
│   │   │   │   └── view.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Text
│   │   │   │   └── Text.module.scss
│   │   │   ├── Text.js
│   │   │   └── index.js
│   │   └── visual
│   │       ├── Collapse.jsx
│   │       ├── Dialog.jsx
│   │       ├── Filter.jsx
│   │       ├── Header.jsx
│   │       ├── Header.scss
│   │       ├── Repeater.js
│   │       ├── Style.jsx
│   │       ├── View.jsx
│   │       └── index.js
│   ├── tools
│   │   ├── Base.jsx
│   │   ├── Brightness.jsx
│   │   ├── Brush.jsx
│   │   ├── Contrast.jsx
│   │   ├── Ellipse.js
│   │   ├── Erase.jsx
│   │   ├── KeyPoint.js
│   │   ├── LiveWire.jsx
│   │   ├── MagicWand.jsx
│   │   ├── Manager.js
│   │   ├── Polygon.js
│   │   ├── Rect.js
│   │   ├── Rotate.jsx
│   │   ├── Selection.js
│   │   ├── Tools.module.scss
│   │   ├── Zoom.jsx
│   │   └── index.js
│   └── utils
│       ├── FileLoader.ts
│       ├── InputMask.ts
│       ├── __tests__
│       │   ├── canvas.test.js
│       │   ├── colors.test.js
│       │   ├── data.test.js
│       │   ├── date.test.js
│       │   ├── debounce.test.js
│       │   ├── html.test.ts
│       │   ├── props.test.js
│       │   ├── styles.test.js
│       │   ├── unique.test.js
│       │   └── utilities.test.js
│       ├── bboxCoords.js
│       ├── bem.ts
│       ├── billing.ts
│       ├── canvas.js
│       ├── colors.js
│       ├── commentClassification.ts
│       ├── data.js
│       ├── date.js
│       ├── debounce.js
│       ├── docs.ts
│       ├── events.ts
│       ├── feature-flags.ts
│       ├── html.js
│       ├── image.js
│       ├── index.js
│       ├── livewire.js
│       ├── magic-wand.js
│       ├── messages.jsx
│       ├── number.js
│       ├── props.ts
│       ├── reactCleaner.js
│       ├── resize-observer.ts
│       ├── scissor.js
│       ├── selection-tools.js
│       ├── styles.js
│       ├── unique.ts
│       └── utilities.ts
```

