import React from 'react';
import { modal } from '../../components/Modal/Modal';
import { Block, Elem } from '../../utils/bem';
import './file-viewer-modal.scss';

interface FileViewerModalProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
}

const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
};

export const showFileViewer = ({ fileUrl, fileName, fileType }: FileViewerModalProps) => {
  const sanitizedUrl = sanitizeUrl(fileUrl);

  if (!sanitizedUrl) {
    return modal({
      title: 'Error',
      children: <div>Invalid file URL</div>,
    });
  }

  const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileType) ||
                  /image\/(jpeg|png|gif|bmp|webp)/.test(fileType);
  const isPDF = /\.pdf$/i.test(fileType) || fileType === 'application/pdf';

  const modalInstance = modal({
    title: fileName,
    style: { width: '90vw', maxWidth: '1400px' },
    bodyStyle: { padding: 0, height: '85vh', overflow: 'auto' },
    footer: null,
    allowClose: true,
    children: (
      <Block name="file-viewer">
        {isPDF && (
          <Elem name="pdf-container">
            <iframe
              src={sanitizedUrl}
              title={fileName}
              style={{
                width: '100%',
                height: '85vh',
                border: 'none',
                display: 'block'
              }}
            />
          </Elem>
        )}
        {isImage && (
          <Elem name="image-container">
            <img
              src={sanitizedUrl}
              alt={fileName}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '85vh',
                display: 'block',
                margin: '0 auto',
                objectFit: 'contain'
              }}
            />
          </Elem>
        )}
        {!isPDF && !isImage && (
          <Elem name="unsupported-container">
            <Elem name="message">
              Preview not available for this file type.
              <br />
              <a href={sanitizedUrl} target="_blank" rel="noopener noreferrer">
                Open in new tab
              </a>
            </Elem>
          </Elem>
        )}
      </Block>
    ),
  });

  return modalInstance;
};
