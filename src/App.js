import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import {degrees, PDFDocument, rgb, StandardFonts} from 'pdf-lib';
import {Document, Page, pdfjs} from 'react-pdf';
import { fabric } from "fabric";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const pdfUrl = 'https://i5possible.github.io/assets/cheat-sheet/github-git-cheat-sheet.pdf';

const App = () => {

    const [pdfDoc, setPdfDoc] = useState(null)
    const docRef = useRef(null);
    const pageRef = useRef(null);
    const canvasRef = useRef(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [fabricObj, setFabricObj] = useState({});

    const [canvasObjects, setCanvasObjects] = useState([]);

    useEffect(() => {
        const fetchPdf = async () => {
            console.log('fetching pdf...')
            const existingPdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());
            console.log('file loaded')
            // const uint8Array = new Uint8Array(existingPdfBytes);
            // setFileView(uint8Array);
            const pdfDoc = await PDFDocument.load(existingPdfBytes)

            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

            const pages = pdfDoc.getPages()
            console.log(pages);
            const firstPage = pages[0]

// Draw a string of text diagonally across the first page
//             firstPage.drawText('This text was added with JavaScript!', {
//                 x: 5,
//                 y: height / 2 + 300,
//                 size: 50,
//                 font: helveticaFont,
//                 color: rgb(0.95, 0.1, 0.1),
//                 rotate: degrees(-45),
//             })

            setPdfDoc(pdfDoc)
        }

        fetchPdf();

    }, [pdfUrl])

    useEffect(() => {
        if (!canvasRef.current) {
            return
        }
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        console.log(width, height)

        const fabricObj = new fabric.Canvas(canvasRef.current, {
            freeDrawingBrush: {
                width: 1,
            },
            isDrawingMode: false,
        });

        const textbox = new fabric.Textbox('This is a Textbox object', {
            left: 100,
            top: 90,
            fontSize: 14,
            width: 100,
            fill: '#333333',
            strokeWidth: 1,
            stroke: "#333333",
        });

        fabricObj.add(textbox);
        setFabricObj(fabricObj);
    }, [canvasRef.current])

    function onDocumentLoadSuccess({numPages}) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    function onPageLoadSuccess() {
        fabricObj.setWidth(pageRef.current.ref.offsetWidth)
        fabricObj.setHeight(pageRef.current.ref.offsetHeight)
    }

    function changePage(offset) {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    }

    function previousPage() {
        changePage(-1);
    }

    function nextPage() {
        changePage(1);
    }

    return (
        <>
            <Document
                ref={docRef}
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                className='document'
            >
                <canvas
                    ref={canvasRef}
                    className='canvas-container'
                />
                <Page
                    ref={pageRef}
                    className='page'
                    pageNumber={pageNumber}
                    renderTextLayer={false}
                    onLoadSuccess={onPageLoadSuccess}
                />
            </Document>
            <div>
                <p>
                    Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
                </p>
                <button
                    type="button"
                    disabled={pageNumber <= 1}
                    onClick={previousPage}
                >
                    Previous
                </button>
                <button
                    type="button"
                    disabled={pageNumber >= numPages}
                    onClick={nextPage}
                >
                    Next
                </button>
            </div>
        </>
    );
}

export default App;
