import { useEffect } from "react";
import { Group, Rect } from "react-konva";
import { observer } from "mobx-react";

const OCROverlay = observer(({ item, store }) => {
  const ocrData = item.ocrData;
  const loading = item.ocrLoading;
  const isVisible = item.ocrOverlayVisible;

  useEffect(() => {
    if (store?.task?.id && !loading) {
      item.fetchOCRData().catch(error => {
        console.error('Failed to fetch OCR data:', error);
      });
    }
  }, [item.currentItemIndex, store?.task?.id]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        item.toggleOCROverlay();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, item]);

  if (loading) {
    return null;
  }

  if (!ocrData?.characters?.length) {
    return null;
  }

  if (!isVisible) {
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
        // Find the correct TextArea control that's associated with the rectangle control
        const textAreaControls = item.annotation.names.values().filter(
          control => control.type === 'textarea' && control.toname === rectangleControl.toname
        );

        // If there are multiple TextAreas, find the one that matches the current label context
        let textAreaControl = null;
        if (textAreaControls.length === 1) {
          textAreaControl = textAreaControls[0];
        } else if (textAreaControls.length > 1) {
          // Check if any TextArea has a whenLabelValue that matches the selected labels
          const selectedLabels = rectangleControl.selectedLabels || [];
          textAreaControl = textAreaControls.find(control => {
            if (control.whenlabelvalue) {
              return selectedLabels.some(label => label.value === control.whenlabelvalue);
            }
            return !control.whenlabelvalue; // Prefer TextArea without label restrictions
          }) || textAreaControls[0]; // Fallback to first one if no match
        }

        if (textAreaControl && textAreaControl.perregion) {
          console.log('[OCR Fix] Found perRegion TextArea:', textAreaControl.name, 'for rectangle:', rectangleControl.name);
          item.annotation.selectArea(region);
          textAreaControl.addText(ocrChar.character);
        } else if (textAreaControl) {
          console.log('[OCR Fix] Found non-perRegion TextArea:', textAreaControl.name, 'for rectangle:', rectangleControl.name);
          textAreaControl.addText(ocrChar.character);
        } else {
          console.log('[OCR Fix] No matching TextArea control found for rectangle:', rectangleControl.name);
          console.log('[OCR Fix] Available TextArea controls:',
            item.annotation.names.values().filter(c => c.type === 'textarea').map(c => ({ name: c.name, toname: c.toname, whenlabelvalue: c.whenlabelvalue }))
          );
        }
      }
    } catch (error) {
      console.error('Failed to create OCR region:', error);
    }
  };

  return (
    <Group name="ocr-overlay">
      {ocrData.characters.map((ocrChar, index) => {
        const coords = getDisplayCoords(ocrChar);
        if (!coords) {
          return null;
        }

        const style = getCharacterStyle(ocrChar.confidence);

        return (
          <Rect
            key={`ocr-char-${ocrChar.id || index}`}
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
