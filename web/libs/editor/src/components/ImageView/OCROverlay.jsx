import { useEffect, useState } from "react";
import { Group, Rect } from "react-konva";
import { observer } from "mobx-react";

const OCROverlay = observer(({ item, store }) => {
  const [ocrData, setOcrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const taskId = store?.task?.id;

  useEffect(() => {
    const fetchOCRData = async () => {
      if (!taskId) return;

      setLoading(true);
      try {
        // Use relative URL for API call
        const response = await fetch(`/api/tasks/${taskId}/ocr-extractions/`);
        if (response.ok) {
          const data = await response.json();
          setOcrData(data);
        } else {
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchOCRData();
  }, [taskId]);

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

  if (loading || !ocrData?.characters?.length || !isVisible) {
    return null;
  }

  const getDisplayCoords = (ocrChar) => {
    if (!item?.stageWidth || !item?.stageHeight) {
      return null;
    }

    const x = ocrChar.x * item.stageWidth;
    const y = ocrChar.y * item.stageHeight;
    const width = ocrChar.width * item.stageWidth;
    const height = ocrChar.height * item.stageHeight;

    return { x, y, width, height };
  };

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

  const handleCharacterClick = (ocrChar) => {
    const rectangleControl = item.annotation.names.values().find(
      control => control.type === 'rectanglelabels' || control.type === 'rectangle'
    );

    if (!rectangleControl) {
      console.warn('No RectangleLabels control found for OCR annotation');
      return;
    }

    if (rectangleControl.type === 'rectanglelabels' && rectangleControl.selectedLabels?.length === 0) {
      alert('Please select a label first before clicking OCR characters');
      return;
    }

    const canvasX = ocrChar.x * item.stageWidth;
    const canvasY = ocrChar.y * item.stageHeight;
    const canvasWidth = ocrChar.width * item.stageWidth;
    const canvasHeight = ocrChar.height * item.stageHeight;
    const areaValue = {
      x: canvasX,
      y: canvasY,
      width: canvasWidth,
      height: canvasHeight,
      rotation: 0
    };

    try {
      const resultValue = rectangleControl.getResultValue();
      const fullResultValue = {
        ...resultValue,
        x: canvasX / item.stageWidth * 100,
        y: canvasY / item.stageHeight * 100,
        width: canvasWidth / item.stageWidth * 100,
        height: canvasHeight / item.stageHeight * 100,
        rotation: 0
      };
      const region = item.annotation.createResult(areaValue, fullResultValue, rectangleControl, item);

      if (region) {
        const textAreaControl = item.annotation.names.values().find(
          control => control.type === 'textarea'
        );

        if (textAreaControl && textAreaControl.perregion) {
          item.annotation.selectArea(region);
          textAreaControl.addText(ocrChar.character);
        } else if (textAreaControl) {
          textAreaControl.addText(ocrChar.character);
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
