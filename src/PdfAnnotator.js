import React, {useEffect, useRef, useState} from 'react';
import './PdfAnnotator.css';
import {PDFDocument, rgb, StandardFonts} from 'pdf-lib';
import {Document, Page, pdfjs} from 'react-pdf';
import {fabric} from "fabric";
import download from "downloadjs";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const pdfUrl = 'https://i5possible.github.io/assets/cheat-sheet/github-git-cheat-sheet.pdf';

const PdfAnnotator = () => {
    const width = 600;

    const [pdfDoc, setPdfDoc] = useState(null)
    const docRef = useRef(null);
    const pageRef = useRef(null);
    const canvasRef = useRef(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
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
            fill: rgb(0.7,0.1,0.1),
            strokeWidth: 1,
            stroke: "#ee3333",
        });

        setFabricObjData([textbox]);

        fabricObj.add(textbox);
        setFabricObj(fabricObj);
    }, [canvasRef.current, pdfDoc])

    function onDocumentLoadSuccess({numPages}) {
        setNumPages(numPages);
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

    async function onPrintClick() {
        const pages = pdfDoc.getPages()
        const firstPage = pages[0]
        const textObj = fabricObjData[0]
        console.log(JSON.stringify(textObj));
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
        // firstPage.drawText(textObj.text, {
        //     x: textObj.left,
        //     y: firstPage.getHeight() - textObj.top - 10,
        //     size: textObj.fontSize,
        //     font: helveticaFont,
        //     color: textObj.fill
        // })
        const dataURL = fabricObj.toDataURL({
            enableRetinaScaling: true,
            withoutTransform: true,
            withoutShadow: true,
            width: fabricObj.width,
            height: fabricObj.height,
            left: 0,
            top: 0,
            format: 'png',
        });
        let image = await pdfDoc.embedPng(dataURL);
        console.log(image.size())
        const imageDims = image.scale(1)
        console.log(imageDims.height)
        console.log(imageDims.width)

        firstPage.drawImage(image, {
            x: 0,
            y: 0,
            width: imageDims.width / fabric.devicePixelRatio,
            height: imageDims.height / fabric.devicePixelRatio,
        })

        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, 'sample.pdf', "application/pdf");
    }

    const onPencilClick = () => {
        fabricObj.isDrawingMode = !fabricObj.isDrawingMode;
    };

    const onDeleteClick = () => {
        const activeObjects = fabricObj.getActiveObjects();
        if (activeObjects && window.confirm("Are you sure to delete?")) {
            fabricObj.remove(...activeObjects);
        }
    }

    const onTextClick = () => {
        const textbox = new fabric.Textbox('This is a Textbox object', {
            left: 0,
            top: 0,
            fontSize: 14,
            width: 100,
            fill: '#880E4F',
            strokeWidth: 1,
            stroke: "#D81B60",
        });

        fabricObj.add(textbox);
    }
    
    const changePage = (offset) => {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    }
    
    const previousPage = () => {
        changePage(-1);
    }
    
    const nextPage = () => {
        changePage(1);
    }

    return (
        <div className="pdf-container">
            <div className="toolbar">
                <div className="tool">
                    <button className="tool-button">
                        <i className="fa fa-pencil"
                           title="Pencil"
                           onClick={onPencilClick}>
                        </i>
                    </button>
                </div>
                <div className="tool">
                    <button className="tool-button">
                        <i className="fa fa-print"
                           title="Print"
                           onClick={onPrintClick}>
                        </i>
                    </button>
                </div>
                <div className="tool">
                    <button className="tool-button">
                        <i className="fa fa-font"
                           title="Print"
                           onClick={onTextClick}>
                        </i>
                    </button>
                </div>
                <div className="tool">
                    <button className="tool-button">
                        <i className="fa fa-remove"
                           title="Print"
                           onClick={onDeleteClick}>
                        </i>
                    </button>
                </div>
            </div>
            <div className="pdf-content" style={{width: width}}>
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
                        width={width}
                        onLoadSuccess={onPageLoadSuccess}
                    />
                </Document>
            </div>
            <div className="page-control">
                <button className="left"
                    disabled={pageNumber <= 1}
                    onClick={previousPage}
                >
                    <i className="fa fa-arrow-left" />
                </button>
                <button className="right"
                    disabled={pageNumber >= numPages}
                    onClick={nextPage}
                >
                    <i className="fa fa-arrow-right" />
                </button>
            </div>
        </div>
    );
}

export default PdfAnnotator;
