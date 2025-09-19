/**
 * OCR Word Detection Utilities
 *
 * Provides functionality for detecting and manipulating OCR word boundaries
 * to enable smart snapping during rectangle drawing operations.
 */

/**
 * Calculate distance between a point and a rectangle
 */
function distanceToRect(x, y, rect) {
  const { x: rx, y: ry, width, height } = rect;
  const dx = Math.max(0, Math.max(rx - x, x - (rx + width)));
  const dy = Math.max(0, Math.max(ry - y, y - (ry + height)));
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if two rectangles intersect
 */
function rectanglesIntersect(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

/**
 * Calculate intersection area between two rectangles
 */
function calculateIntersectionArea(rect1, rect2) {
  const x1 = Math.max(rect1.x, rect2.x);
  const y1 = Math.max(rect1.y, rect2.y);
  const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
  const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

  if (x2 <= x1 || y2 <= y1) return 0;
  return (x2 - x1) * (y2 - y1);
}

/**
 * Calculate what percentage of rect1 is covered by intersection with rect2
 */
function calculateIntersectionPercentage(rect1, rect2) {
  const intersectionArea = calculateIntersectionArea(rect1, rect2);
  const rect1Area = rect1.width * rect1.height;

  if (rect1Area === 0) return 0;
  return intersectionArea / rect1Area;
}

/**
 * Check if rectangles intersect with minimum coverage threshold
 */
function rectanglesIntersectWithThreshold(rect1, rect2, minIntersectionPercentage = 0.1) {
  if (!rectanglesIntersect(rect1, rect2)) return false;

  const intersectionPercentage = calculateIntersectionPercentage(rect1, rect2);
  return intersectionPercentage >= minIntersectionPercentage;
}

/**
 * Check if a point is inside a rectangle
 */
function pointInRect(x, y, rect) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

/**
 * Calculate bounding box that encompasses multiple rectangles
 */
function calculateBoundingBox(rects) {
  if (!rects || rects.length === 0) return null;

  const firstRect = rects[0];
  let minX = firstRect.x;
  let minY = firstRect.y;
  let maxX = firstRect.x + firstRect.width;
  let maxY = firstRect.y + firstRect.height;

  for (let i = 1; i < rects.length; i++) {
    const rect = rects[i];
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Convert OCR character data to structured word and line data
 */
function processOCRData(characters) {
  console.log('[OCR Debug] Processing OCR data - character count:', characters?.length);
  if (!characters || characters.length === 0) {
    return {
      words: [],
      lines: [],
      spatialIndex: null
    };
  }

  console.log('[OCR Debug] First 10 characters:', characters.slice(0, 10).map(c => ({
    char: c.character,
    x: c.x,
    y: c.y,
    width: c.width,
    height: c.height
  })));

  // Debug: Check if we have character-level data or word-level data
  console.log('[OCR Debug] Sample character data structure:', characters[0]);
  console.log('[OCR Debug] Is this character or word level data?', characters.length < 100 ? 'likely word-level' : 'likely character-level');

  // Sort characters by position (top to bottom, left to right)
  const sortedChars = [...characters].sort((a, b) => {
    if (Math.abs(a.y - b.y) < 0.01) { // Same line threshold for normalized coordinates
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  const words = [];
  const lines = [];
  let currentWord = [];
  let currentLine = [];
  let wordId = 1;
  let lineId = 1;
  let currentLineIndex = 0;
  let wordIndexInLine = 0;

  for (let i = 0; i < sortedChars.length; i++) {
    const char = sortedChars[i];
    const nextChar = sortedChars[i + 1];

    currentWord.push(char);

    // Check if we're starting a new line (using normalized coordinate threshold)
    const isNewLine = nextChar && Math.abs(nextChar.y - char.y) > 0.01;

    // Determine if this is the end of a word (using absolute threshold for normalized coordinates)
    const isWordEnd = !nextChar ||
                     char.character === ' ' ||
                     nextChar.character === ' ' ||
                     isNewLine ||
                     (nextChar.x - (char.x + char.width)) > 0.005; // Gap threshold for normalized coords

    if (isWordEnd && currentWord.length > 0) {
      // Filter out spaces
      const wordChars = currentWord.filter(c => c.character.trim() !== '');

      if (wordChars.length > 0) {
        const wordBbox = calculateBoundingBox(wordChars.map(c => ({
          x: c.x,
          y: c.y,
          width: c.width,
          height: c.height
        })));

        const wordText = wordChars.map(c => c.character).join('');
        const avgConfidence = wordChars.reduce((sum, c) => sum + c.confidence, 0) / wordChars.length;

        const word = {
          id: `word_${wordId}`,
          text: wordText,
          bbox: wordBbox,
          confidence: avgConfidence,
          characters: wordChars,
          lineIndex: currentLineIndex,
          wordIndex: wordIndexInLine,
          characterIds: wordChars.map(c => c.id || `char_${i}`)
        };

        words.push(word);
        currentLine.push(word.id);
        wordId++;
        wordIndexInLine++;
      }

      currentWord = [];
    }

    // Handle line breaks
    if (isNewLine || !nextChar) {
      if (currentLine.length > 0) {
        // Calculate line bounding box
        const lineWords = words.filter(w => currentLine.includes(w.id));
        const lineBbox = calculateBoundingBox(lineWords.map(w => w.bbox));
        const lineText = lineWords.map(w => w.text).join(' ');

        lines.push({
          id: `line_${lineId}`,
          bbox: lineBbox,
          words: [...currentLine], // Word IDs in order
          text: lineText,
          lineIndex: currentLineIndex,
          wordCount: currentLine.length
        });

        lineId++;
        currentLineIndex++;
        currentLine = [];
        wordIndexInLine = 0;
      }
    }
  }

  console.log('[OCR Debug] Word processing completed:');
  console.log('[OCR Debug] Total words created:', words.length);
  console.log('[OCR Debug] Total lines created:', lines.length);
  console.log('[OCR Debug] First 5 words:', words.slice(0, 5).map(w => w.text));
  console.log('[OCR Debug] Last 5 words:', words.slice(-5).map(w => w.text));

  return {
    words,
    lines,
    spatialIndex: null // Will be built when needed
  };
}

/**
 * Convert OCR character data to word-level data (legacy function for compatibility)
 */
function groupCharactersIntoWords(characters) {
  const processed = processOCRData(characters);
  return processed.words;
}

/**
 * Main OCR Word Detection utility class
 */
export const OCRWordDetection = {
  /**
   * Find the closest word to a given point
   */
  findNearestWord(x, y, ocrData, threshold = 10) {
    if (!ocrData || !ocrData.characters) return null;

    const words = this.getWords(ocrData);
    let nearestWord = null;
    let minDistance = Infinity;

    for (const word of words) {
      const distance = distanceToRect(x, y, word.bbox);
      if (distance <= threshold && distance < minDistance) {
        minDistance = distance;
        nearestWord = word;
      }
    }

    return nearestWord;
  },

  /**
   * Get exact bounding box of a word
   */
  getWordBoundingBox(word) {
    if (!word || !word.bbox) return null;
    return { ...word.bbox };
  },

  /**
   * Find all words within a rectangular region
   */
  findWordsInRegion(x1, y1, x2, y2, ocrData, minIntersectionPercentage = 0.1) {
    if (!ocrData || !ocrData.characters) return [];

    const region = {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1)
    };

    const words = this.getWords(ocrData);
    return words.filter(word =>
      rectanglesIntersectWithThreshold(word.bbox, region, minIntersectionPercentage)
    );
  },

  /**
   * Find words near the edges of a rectangle
   */
  findWordsNearRegion(x1, y1, x2, y2, ocrData, threshold = 0.01) {
    if (!ocrData || !ocrData.characters) return [];

    const region = {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1)
    };

    const words = this.getWords(ocrData);
    return words.filter(word => {
      const distance = distanceToRect(
        word.bbox.x + word.bbox.width / 2,
        word.bbox.y + word.bbox.height / 2,
        region
      );
      return distance <= threshold && distance > 0;
    });
  },

  /**
   * Adjust rectangle to snap to word boundaries
   */
  snapToWordBoundaries(rect, ocrData, snapThreshold = 0.01, minIntersectionPercentage = 0.05) {
    console.log('[OCR Debug] snapToWordBoundaries called with:', { rect, snapThreshold, minIntersectionPercentage });
    console.log('[OCR Debug] OCR data available:', !!ocrData, 'words count:', ocrData?.words?.length);

    if (!ocrData || !ocrData.characters) {
      console.log('[OCR Debug] No OCR data or characters available');
      return null;
    }

    const { x, y, width, height } = rect;
    const x1 = x;
    const y1 = y;
    const x2 = x + width;
    const y2 = y + height;

    console.log('[OCR Debug] Rectangle bounds:', { x1, y1, x2, y2 });
    console.log('[OCR Debug] Available words:', ocrData.words.map(w => ({
      text: w.text,
      bbox: w.bbox,
      center: { x: w.bbox.x + w.bbox.width/2, y: w.bbox.y + w.bbox.height/2 }
    })));

    // Calculate distance from rectangle to each word for debugging
    ocrData.words.forEach((word, index) => {
      const wordCenter = { x: word.bbox.x + word.bbox.width/2, y: word.bbox.y + word.bbox.height/2 };
      const distance = distanceToRect(wordCenter.x, wordCenter.y, { x: x1, y: y1, width: x2-x1, height: y2-y1 });
      console.log(`[OCR Debug] Word ${index} "${word.text}":`, {
        bbox: word.bbox,
        center: wordCenter,
        distanceToRect: distance,
        intersects: rectanglesIntersect(word.bbox, { x: x1, y: y1, width: x2-x1, height: y2-y1 }),
        intersectionPercentage: calculateIntersectionPercentage(word.bbox, { x: x1, y: y1, width: x2-x1, height: y2-y1 })
      });
    });

    // Find words intersecting with rectangle (with minimum intersection threshold)
    const intersectingWords = this.findWordsInRegion(x1, y1, x2, y2, ocrData, minIntersectionPercentage);
    console.log('[OCR Debug] Intersecting words:', intersectingWords.length, intersectingWords.map(w => w.text));

    // Find words near rectangle edges
    const nearbyWords = this.findWordsNearRegion(x1, y1, x2, y2, ocrData, snapThreshold);
    console.log('[OCR Debug] Nearby words:', nearbyWords.length, nearbyWords.map(w => w.text));

    // Combine all relevant words
    const allWords = [...intersectingWords, ...nearbyWords];
    console.log('[OCR Debug] Total relevant words found:', allWords.length);

    if (allWords.length === 0) {
      console.log('[OCR Debug] No words found in or near rectangle - returning null');
      return null;
    }

    // Smart snapping logic: For small rectangles (single word selection),
    // snap to the best matching word instead of all words
    const isSmallRectangle = width < 0.15 && height < 0.05; // Small rectangle likely selecting 1-2 words
    console.log('[OCR Debug] Rectangle size analysis:', { width, height, isSmallRectangle });

    let finalWords = allWords;

    if (isSmallRectangle && allWords.length > 3) {
      console.log('[OCR Debug] Small rectangle detected - finding best matching word(s)');

      // For small rectangles, find the word with highest intersection percentage
      let bestWord = null;
      let bestIntersectionPercentage = 0;

      for (const word of intersectingWords) {
        const intersection = calculateIntersectionPercentage(word.bbox, { x: x1, y: y1, width: x2-x1, height: y2-y1 });
        if (intersection > bestIntersectionPercentage) {
          bestIntersectionPercentage = intersection;
          bestWord = word;
        }
      }

      // If we found a good intersecting word, use only that word
      if (bestWord && bestIntersectionPercentage > 0.1) {
        finalWords = [bestWord];
        console.log('[OCR Debug] Selected best intersecting word:', bestWord.text, 'with intersection:', bestIntersectionPercentage);
      } else {
        // Otherwise, find the closest nearby word
        let closestWord = null;
        let closestDistance = Infinity;

        for (const word of nearbyWords) {
          const wordCenter = { x: word.bbox.x + word.bbox.width/2, y: word.bbox.y + word.bbox.height/2 };
          const distance = distanceToRect(wordCenter.x, wordCenter.y, { x: x1, y: y1, width: x2-x1, height: y2-y1 });
          if (distance < closestDistance) {
            closestDistance = distance;
            closestWord = word;
          }
        }

        if (closestWord) {
          finalWords = [closestWord];
          console.log('[OCR Debug] Selected closest word:', closestWord.text, 'with distance:', closestDistance);
        }
      }
    } else {
      console.log('[OCR Debug] Large rectangle or few words - using all relevant words');
    }

    // Calculate bounding box that encompasses final selected words
    const wordBounds = finalWords.map(word => word.bbox);
    const snappedBounds = calculateBoundingBox(wordBounds);

    console.log('[OCR Debug] Final snapped bounds:', snappedBounds, 'for words:', finalWords.map(w => w.text));

    return {
      x: snappedBounds.x,
      y: snappedBounds.y,
      width: snappedBounds.width,
      height: snappedBounds.height,
      words: finalWords,
      originalRect: rect
    };
  },

  /**
   * Calculate if point is near a word
   */
  isNearWord(x, y, word, threshold = 10) {
    if (!word || !word.bbox) return false;
    return distanceToRect(x, y, word.bbox) <= threshold;
  },

  /**
   * Process raw OCR character data into structured format
   */
  processOCRData(rawData) {
    if (!rawData || !rawData.characters) return processOCRData([]);
    return processOCRData(rawData.characters);
  },

  /**
   * Compose text from words in a rectangle, maintaining reading order
   */
  composeTextFromRegion(x1, y1, x2, y2, ocrData, minIntersectionPercentage = 0.1) {
    if (!ocrData || !ocrData.words) return { text: '', words: [], lines: [], wordCount: 0, lineCount: 0 };

    // Find all words in the rectangle
    const wordsInRegion = this.findWordsInRegionStructured(x1, y1, x2, y2, ocrData, minIntersectionPercentage);

    if (wordsInRegion.length === 0) {
      return { text: '', words: [], lines: [], wordCount: 0, lineCount: 0 };
    }

    // Group words by line index
    const lineGroups = new Map();
    wordsInRegion.forEach(word => {
      if (!lineGroups.has(word.lineIndex)) {
        lineGroups.set(word.lineIndex, []);
      }
      lineGroups.get(word.lineIndex).push(word);
    });

    // Sort lines top to bottom, words left to right within each line
    const sortedLines = Array.from(lineGroups.entries())
      .sort((a, b) => a[0] - b[0]) // Sort by line index
      .map(([lineIndex, words]) =>
        words.sort((a, b) => a.wordIndex - b.wordIndex) // Sort words in line
      );

    // Compose text with proper spacing and line breaks
    const composedText = sortedLines
      .map(lineWords => lineWords.map(w => w.text).join(' '))
      .filter(lineText => lineText.trim()) // Remove empty lines
      .join('\n');

    // Get line information
    const lineIndices = [...new Set(wordsInRegion.map(w => w.lineIndex))];
    const relevantLines = ocrData.lines?.filter(line => lineIndices.includes(line.lineIndex)) || [];

    return {
      text: composedText,
      words: wordsInRegion,
      lines: relevantLines,
      wordCount: wordsInRegion.length,
      lineCount: sortedLines.length
    };
  },

  /**
   * Find words in region using structured data
   */
  findWordsInRegionStructured(x1, y1, x2, y2, ocrData, minIntersectionPercentage = 0.1) {
    if (!ocrData || !ocrData.words) return [];

    const region = {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1)
    };

    return ocrData.words.filter(word =>
      rectanglesIntersectWithThreshold(word.bbox, region, minIntersectionPercentage)
    );
  },

  /**
   * Get text for a specific region with caching
   */
  getRegionText(regionId, regionBounds, ocrData, cache = new Map()) {
    // Check cache first
    if (cache.has(regionId)) {
      return cache.get(regionId);
    }

    // Compose text for the region
    const composed = this.composeTextFromRegion(
      regionBounds.x,
      regionBounds.y,
      regionBounds.x + regionBounds.width,
      regionBounds.y + regionBounds.height,
      ocrData
    );

    // Cache it
    cache.set(regionId, composed);
    return composed;
  },

  /**
   * Convert OCR character data to words (cached - legacy support)
   */
  getWords(ocrData) {
    if (!ocrData || !ocrData.characters) return [];

    // Check if we have structured data already
    if (ocrData.words) {
      return ocrData.words;
    }

    // Cache words on the ocrData object to avoid recomputation
    if (!ocrData._cachedWords) {
      ocrData._cachedWords = groupCharactersIntoWords(ocrData.characters);
    }

    return ocrData._cachedWords;
  },

  /**
   * Get words in a specific confidence range
   */
  getWordsByConfidence(ocrData, minConfidence = 0, maxConfidence = 1) {
    const words = this.getWords(ocrData);
    return words.filter(word =>
      word.confidence >= minConfidence && word.confidence <= maxConfidence
    );
  },

  /**
   * Find words containing specific text
   */
  findWordsByText(ocrData, searchText, caseSensitive = false) {
    const words = this.getWords(ocrData);
    const search = caseSensitive ? searchText : searchText.toLowerCase();

    return words.filter(word => {
      const text = caseSensitive ? word.text : word.text.toLowerCase();
      return text.includes(search);
    });
  },

  /**
   * Get statistics about OCR data
   */
  getOCRStats(ocrData) {
    if (!ocrData || !ocrData.characters) {
      return {
        totalCharacters: 0,
        totalWords: 0,
        averageConfidence: 0,
        highConfidenceWords: 0,
        mediumConfidenceWords: 0,
        lowConfidenceWords: 0
      };
    }

    const words = this.getWords(ocrData);
    const totalCharacters = ocrData.characters.length;
    const totalWords = words.length;

    if (totalWords === 0) {
      return {
        totalCharacters,
        totalWords: 0,
        averageConfidence: 0,
        highConfidenceWords: 0,
        mediumConfidenceWords: 0,
        lowConfidenceWords: 0
      };
    }

    const totalConfidence = words.reduce((sum, word) => sum + word.confidence, 0);
    const averageConfidence = totalConfidence / totalWords;

    const highConfidenceWords = words.filter(w => w.confidence >= 0.8).length;
    const mediumConfidenceWords = words.filter(w => w.confidence >= 0.6 && w.confidence < 0.8).length;
    const lowConfidenceWords = words.filter(w => w.confidence < 0.6).length;

    return {
      totalCharacters,
      totalWords,
      averageConfidence,
      highConfidenceWords,
      mediumConfidenceWords,
      lowConfidenceWords
    };
  }
};

export default OCRWordDetection;