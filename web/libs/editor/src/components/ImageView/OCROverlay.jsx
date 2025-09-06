import { Fragment, useEffect, useState } from "react";
import { Group, Rect } from "react-konva";
import { observer } from "mobx-react";

/**
 * Simple OCR Overlay component for Community Edition
 * Displays character bounding boxes on images for OCR-assisted annotation
 */
const OCROverlay = observer(({ item, store }) => {
  const [ocrData, setOcrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Get task ID from the store
  const taskId = store?.task?.id;

  console.log(`Task Id: ${taskId}`);

  // Fetch OCR data for the current task
  useEffect(() => {
    const fetchOCRData = async () => {
      console.log("Here overlay")
      if (!taskId) return;

      setLoading(true);
      try {
        // Use relative URL for API call
        const response = await fetch(`/api/tasks/${taskId}/ocr-extractions/`);
        if (response.ok) {
          const data = await response.json();
          setOcrData(data);
          console.log('OCR data loaded:', data);
        } else {
          console.warn('OCR data not available for task', taskId);
        }
      } catch (error) {
        console.error('Failed to fetch OCR data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOCRData();
  }, [taskId]);

  // Keyboard shortcut to toggle OCR overlay (Ctrl/Cmd + Shift + O)
  useEffect(() => {
    const handleKeyPress = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        setIsVisible(prev => !prev);
        console.log('OCR overlay toggled:', !isVisible);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  // Don't render if no data or not visible
  if (loading || !ocrData?.characters?.length || !isVisible) {
    return null;
  }

  // Calculate display coordinates from normalized OCR coordinates
  const getDisplayCoords = (ocrChar) => {
    if (!item?.stageWidth || !item?.stageHeight) {
      return null;
    }

    // Convert normalized coordinates (0-1) to canvas pixel coordinates
    const x = ocrChar.x * item.stageWidth;
    const y = ocrChar.y * item.stageHeight;
    const width = ocrChar.width * item.stageWidth;
    const height = ocrChar.height * item.stageHeight;

    return { x, y, width, height };
  };

  // Simple confidence-based styling
  const getCharacterStyle = (confidence) => {
    if (confidence >= 0.8) {
      return {
        fill: 'rgba(0, 255, 0, 0.1)',
        stroke: '#00aa00',
        strokeWidth: 1
      };
    } else if (confidence >= 0.6) {
      return {
        fill: 'rgba(255, 255, 0, 0.1)',
        stroke: '#aaaa00',
        strokeWidth: 1
      };
    } else {
      return {
        fill: 'rgba(255, 0, 0, 0.1)',
        stroke: '#aa0000',
        strokeWidth: 1
      };
    }
  };

  // Handle character click - create rectangle region
  const handleCharacterClick = (ocrChar) => {
    console.log('OCR character clicked:', {
      character: ocrChar.character,
      confidence: ocrChar.confidence,
      coordinates: {
        x: ocrChar.x,
        y: ocrChar.y,
        width: ocrChar.width,
        height: ocrChar.height
      }
    });

    // Find the RectangleLabels control tag
    const rectangleControl = item.annotation.names.values().find(
      control => control.type === 'rectanglelabels' || control.type === 'rectangle'
    );

    if (!rectangleControl) {
      console.warn('No RectangleLabels control found for OCR annotation');
      return;
    }

    // Check if user has selected a label (for RectangleLabels)
    if (rectangleControl.type === 'rectanglelabels' && rectangleControl.selectedLabels?.length === 0) {
      console.warn('Please select a label first before clicking OCR characters');
      alert('Please select a label first before clicking OCR characters');
      return;
    }

    // Convert normalized coordinates to canvas coordinates
    const canvasX = ocrChar.x * item.stageWidth;
    const canvasY = ocrChar.y * item.stageHeight;
    const canvasWidth = ocrChar.width * item.stageWidth;
    const canvasHeight = ocrChar.height * item.stageHeight;

    // Create the drawing region area value
    const areaValue = {
      x: canvasX,
      y: canvasY,
      width: canvasWidth,
      height: canvasHeight,
      rotation: 0
    };

    try {
      // Let the control generate the proper result value based on its selected labels
      const resultValue = rectangleControl.getResultValue();

      // Add the geometric properties to the result value
      const fullResultValue = {
        ...resultValue,
        x: canvasX / item.stageWidth * 100, // Convert to percentage for Label Studio
        y: canvasY / item.stageHeight * 100,
        width: canvasWidth / item.stageWidth * 100,
        height: canvasHeight / item.stageHeight * 100,
        rotation: 0
      };

      // Create the region directly using annotation.createResult (avoiding state tree conflicts)
      const region = item.annotation.createResult(areaValue, fullResultValue, rectangleControl, item);

      if (region) {
        // Find TextArea control for transcription
        const textAreaControl = item.annotation.names.values().find(
          control => control.type === 'textarea'
        );
        
        if (textAreaControl && textAreaControl.perregion) {
          // For per-region TextArea, we need to:
          // 1. Select the region to make it active
          // 2. Let the TextArea control create its result properly through the normal flow
          
          // Select the region first to make it active
          item.annotation.selectArea(region);
          
          // Now add text through the TextArea control's normal method
          // This will create the TextArea result and associate it with the selected region properly
          textAreaControl.addText(ocrChar.character);
          
          console.log('Created OCR-based rectangle region with per-region TextArea:', {
            region,
            character: ocrChar.character,
            confidence: ocrChar.confidence
          });
        } else if (textAreaControl) {
          // For global TextArea, add text to the control itself
          textAreaControl.addText(ocrChar.character);
          
          console.log('Created OCR-based rectangle region and added text to global TextArea:', {
            region,
            character: ocrChar.character,
            confidence: ocrChar.confidence
          });
        } else {
          console.log('Created OCR-based rectangle region without text (no TextArea control found):', region);
        }
      }
    } catch (error) {
      console.error('Failed to create OCR region:', error);
    }
  };

  return (
    <Group name="ocr-overlay">
      {ocrData.characters.map((ocrChar) => {
        const coords = getDisplayCoords(ocrChar);
        if (!coords) return null;

        const style = getCharacterStyle(ocrChar.confidence);

        return (
          <Rect
            key={`ocr-char-${ocrChar.id}`}
            x={coords.x}
            y={coords.y}
            width={coords.width}
            height={coords.height}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            listening={true}
            onClick={() => handleCharacterClick(ocrChar)}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage?.container) {
                stage.container().style.cursor = 'pointer';
              }
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage?.container) {
                stage.container().style.cursor = 'default';
              }
            }}
          />
        );
      })}
    </Group>
  );
});

export default OCROverlay;
