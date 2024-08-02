import React, { useState, useEffect } from "react";
import PDFDocument from 'pdf-parser-client-side';
import s from "../styles/Resume.less";

const resumePath = "../assets/resume.pdf";

const Resume: React.FC = () => {
  const [pdfDocument, setPdfDocument] = useState<any | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageContent, setPageContent] = useState<string>("");

  useEffect(() => {
    const loadPDF = async () => {
      // TODO: fix resume loading
      // const response = await fetch(resumePath);
      // const arrayBuffer = await response.arrayBuffer();
      // const file = new File([arrayBuffer], 'resume.pdf', { type: 'application/pdf' });
      // const pdf = await PDFDocument(file, 'pdf');
      // setPdfDocument(pdf);
    };
    loadPDF();
  }, []);

  useEffect(() => {
    const renderPage = async () => {
      if (pdfDocument) {
        const page = await pdfDocument.getPage(pageNumber);
        const content = await page.getText();
        setPageContent(content);
      }
    };
    renderPage();
  }, [pdfDocument, pageNumber]);

  return (
    <div className={s.resume}>
      <div className="pdf-content" style={{ transform: `scale(${scale})` }}>
        <pre>{pageContent}</pre>
      </div>
      <div className="controls">
        <button 
          disabled={pageNumber <= 1} 
          onClick={() => setPageNumber(prevPageNumber => prevPageNumber - 1)}
        >
          Previous
        </button>
        <span>{`Page ${pageNumber} of ${pdfDocument?.numPages || 1}`}</span>
        <button 
          disabled={pageNumber >= (pdfDocument?.numPages || 1)} 
          onClick={() => setPageNumber(prevPageNumber => prevPageNumber + 1)}
        >
          Next
        </button>
        <button onClick={() => setScale(prevScale => prevScale + 0.1)}>
          Zoom In
        </button>
        <button onClick={() => setScale(prevScale => prevScale - 0.1)}>
          Zoom Out
        </button>
      </div>
    </div>
  );
};

export default Resume;