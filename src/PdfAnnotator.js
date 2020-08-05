import React, {useEffect, useRef, useState} from 'react';
import './PdfAnnotator.css';
import {degrees, PDFDocument, rgb, StandardFonts} from 'pdf-lib';
import {Document, Page, pdfjs} from 'react-pdf';
import { fabric } from "fabric";
import download from "downloadjs";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const pdfUrl = 'https://i5possible.github.io/assets/cheat-sheet/github-git-cheat-sheet.pdf';

const PdfAnnotator = () => {

    const [pdfDoc, setPdfDoc] = useState(null)
    const docRef = useRef(null);
    const pageRef = useRef(null);
    const canvasRef = useRef(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(null);
    const [fabricObj, setFabricObj] = useState(null);
    const [fabricObjData, setFabricObjData] = useState({})

    console.log('canvasRef', canvasRef.current);

    useEffect(() => {
        const fetchPdf = async () => {
            console.log('fetching pdf...')
            const existingPdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());
            console.log('file loaded')
            // const uint8Array = new Uint8Array(existingPdfBytes);
            // setFileView(uint8Array);
            const pdfDoc = await PDFDocument.load(existingPdfBytes)

            const pages = pdfDoc.getPages()
            console.log(pages);
            setPdfDoc(pdfDoc)
        }
        fetchPdf();

    }, [pdfUrl])

    useEffect(() => {
        console.log('render canvas:', canvasRef.current)
        if (!canvasRef.current) {
            return
        }
        console.log('create fabricObj')
        const fabricObj = new fabric.Canvas(canvasRef.current, {
            freeDrawingBrush: {
                width: 1,
            },
            isDrawingMode: false,
        });

        const textbox = new fabric.Textbox('This is a Textbox object', {
            left: 100,
            top: 200,
            fontSize: 14,
            width: 100,
            fill: rgb(0.1,0.1,0.1),
            strokeWidth: 1,
            stroke: "#333333",
        });

        setFabricObjData([textbox]);

        fabricObj.add(textbox);
        setFabricObj(fabricObj);
    }, [canvasRef.current, pdfDoc])

    function onDocumentLoadSuccess({numPages}) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    function onPageLoadSuccess() {
        if (!fabricObj) {
            return;
        }
        setCanvasWindow()
    }

    function setCanvasWindow() {
        fabricObj.setWidth(pageRef.current.ref.offsetWidth)
        fabricObj.setHeight(pageRef.current.ref.offsetHeight)
    }

    async function onClick() {
        const pages = pdfDoc.getPages()
        const firstPage = pages[0]
        const textObj = fabricObjData[0]
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
        firstPage.drawText(textObj.text, {
            x: textObj.left,
            y: firstPage.getHeight() - textObj.top - 10,
            size: textObj.fontSize,
            font: helveticaFont,
            color: textObj.fill
        })
        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, 'sample.pdf', "application/pdf");
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
            <button onClick={onClick}>
                Save
            </button>
        </>
    );
}

export default PdfAnnotator;
