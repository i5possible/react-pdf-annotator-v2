import React, {useEffect, useRef, useState} from 'react';
import './PdfAnnotator.css';
import {PDFDocument} from 'pdf-lib';
import {Document, Page, pdfjs} from 'react-pdf';
import {fabric} from "fabric";
import download from "downloadjs";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// const pdfUrl = 'https://i5possible.github.io/assets/cheat-sheet/github-git-cheat-sheet.pdf';

const PdfAnnotator = () => {
    const width = 600;

    const [pdfFile, setPdfFile] = useState("");
    const [existingPdfBytes, setExistingPdfBytes] = useState("");
    const [pdfDoc, setPdfDoc] = useState(null)
    const docRef = useRef(null);
    const pageRef = useRef(null);
    const canvasRef = useRef(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [fabricObj, setFabricObj] = useState(null);
    const [fabricObjData, setFabricObjData] = useState({})

    // const fetchPdf = async () => {
    //     console.log('fetching pdf...')
    //     const existingPdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());
    //     console.log('file loaded')
    //     // const uint8Array = new Uint8Array(existingPdfBytes);
    //     // setFileView(uint8Array);
    //     const pdfDoc = await PDFDocument.load(existingPdfBytes)
    //
    //     const pages = pdfDoc.getPages()
    //     console.log(pages);
    //     setPdfDoc(pdfDoc)
    // }
    
    useEffect(() => {
    }, [existingPdfBytes])

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

        // const textbox = new fabric.Textbox('This is a Textbox object', {
        //     left: 100,
        //     top: 200,
        //     fontSize: 14,
        //     width: 100,
        //     fill: rgb(0.7,0.1,0.1),
        //     strokeWidth: 1,
        //     stroke: "#ee3333",
        // });
        //
        // setFabricObjData([textbox]);
        //
        // fabricObj.add(textbox);
        setFabricObj(fabricObj);
    }, [canvasRef.current, pdfDoc])
    
    useEffect(() => {
        if (fabricObj) {
            document.addEventListener('paste', function (e) { paste_auto(e, fabricObj); }, false);
        }
    }, [fabricObj])
    
    const paste_auto = (e, fabricObj) => {
        if (e.clipboardData) {
            const items = e.clipboardData.items;
            if (!items) return;
            
            //access data directly
            let is_image = false;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    //image
                    const blob = items[i].getAsFile();
                    const URLObj = window.URL || window.webkitURL;
                    const source = URLObj.createObjectURL(blob);
                    paste_createImage(source, fabricObj);
                    is_image = true;
                }
            }
            if(is_image === true){
                e.preventDefault();
            }
        }
    };
    
    const paste_createImage = (source, fabricObj) => {
        const pastedImage = new Image();
        pastedImage.onload = async () => {
            const img = await readAsImage(source);
            const image = new fabric.Image(img);
            fabricObj.add(image);
            registerCurrentPageFabricObjs();
        };
        pastedImage.src = source;
    };
  
    useEffect(() => {
        loadCurrentPageFabricObj(pageNumber)
    }, [pageNumber]);
    
    const onUploadPDF = e => {
        const files = e.target.files || (e.dataTransfer && e.dataTransfer.files);
        const file = files[0];
        if (!file || file.type !== "application/pdf") {
            return;
        }
        try {
            const reader = new FileReader();
    
            reader.onload = async function(e) {
                const arrayBuffer = new Uint8Array(reader.result);
                const pdfDoc = await PDFDocument.load(arrayBuffer)
                setPdfFile(file);
                setExistingPdfBytes(arrayBuffer);
                setPdfDoc(pdfDoc)
            }
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.log(error);
        }
    }

    const onDocumentLoadSuccess = ({numPages}) => {
        setNumPages(numPages);
    }

    const onPageLoadSuccess = () => {
        if (!fabricObj) {
            return;
        }
        setCanvasWindow()
    }

    const setCanvasWindow = () => {
        fabricObj.setWidth(pageRef.current.ref.offsetWidth)
        fabricObj.setHeight(pageRef.current.ref.offsetHeight)
    }

    async function onPrintClick() {
        const currentPageFabricObj = fabricObj.getObjects();
        const pages = pdfDoc.getPages();
    
        const currentPage = pages[pageNumber-1];
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
        const image = await pdfDoc.embedPng(dataURL);
        const imageDims = image.scale(1)
    
        currentPage.drawImage(image, {
            x: 0,
            y: 0,
            width: imageDims.width / fabric.devicePixelRatio,
            height: imageDims.height / fabric.devicePixelRatio,
        })
        
        for(let currentPageNumber = 1; currentPageNumber <= numPages; currentPageNumber++) {
            if (currentPageNumber === pageNumber) {
                continue
            }
            const currentPage = pages[currentPageNumber-1];
            clearCanvas();
            loadCurrentPageFabricObj(currentPageNumber);
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
            const image = await pdfDoc.embedPng(dataURL);
            const imageDims = image.scale(1)
    
            currentPage.drawImage(image, {
                x: 0,
                y: 0,
                width: imageDims.width / fabric.devicePixelRatio,
                height: imageDims.height / fabric.devicePixelRatio,
            })
        }

        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, 'sample.pdf', "application/pdf");
        loadCurrentPageFabricObj(pageNumber);
    
        setFabricObjData({
            ...fabricObjData,
            [pageNumber]: currentPageFabricObj,
        })
        
        clearCanvas();
        (currentPageFabricObj || []).forEach(object => {
            fabricObj.add(object);
        })
    }

    const onPencilClick = () => {
        fabricObj.isDrawingMode = !fabricObj.isDrawingMode;
        console.log(fabricObj.isDrawingMode)
        registerCurrentPageFabricObjs();
    };

    const onDeleteClick = () => {
        const activeObjects = fabricObj.getActiveObjects();
        if (activeObjects && window.confirm("Are you sure to delete?")) {
            fabricObj.remove(...activeObjects);
        }
        registerCurrentPageFabricObjs();
    }

    const onTextClick = () => {
        const textbox = new fabric.Textbox('This is a Textbox object', {
            left: 0,
            top: 0,
            fontSize: 14,
            width: 100,
            fill: '#880E4F',
            strokeWidth: 1,
            stroke: "#880E4F",
        });
    
        disablePencil();
        fabricObj.add(textbox);
        registerCurrentPageFabricObjs();
    }
    
    const disablePencil = () => {
        if (fabricObj) {
            fabricObj.isDrawingMode = false;
        }
    }
    
    const onPointerClick = () => {
        disablePencil();
    }
    
    const onUploadImage = (e) => {
        disablePencil();
        const file = e.target.files[0];
        console.log('image file:', file);
        if (file) {
            addImage(file);
        }
        e.target.value = null;
    }
    
    const clearCanvas = () => {
        fabricObj && fabricObj.clear();
    }
    
    const registerCurrentPageFabricObjs = () => {
        let newObjData = {
            ...fabricObjData,
            [pageNumber]: fabricObj.getObjects(),
        };
        setFabricObjData(newObjData)
        console.log(JSON.stringify(newObjData))
    }
    
    const loadCurrentPageFabricObj = (pageNumber) => {
        clearCanvas();
        (fabricObjData[pageNumber] || []).forEach(object => {
            fabricObj.add(object);
        })
    }
    
    const changePage = (offset) => {
        registerCurrentPageFabricObjs();
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    }
    
    const previousPage = () => {
        changePage(-1);
    }
    
    const nextPage = () => {
        changePage(1);
    }
    
    const readAsDataURL = file =>
      new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
      })
    
    const readAsImage = async (src) =>
      new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          if (src instanceof Blob) {
              img.src = window.URL.createObjectURL(src);
          } else {
              img.src = src;
          }
      })
    
    const addImage = async (file) => {
        try {
            // get dataURL to prevent canvas from tainted
            const url = await readAsDataURL(file);
            const img = await readAsImage(url);
            const image = new fabric.Image(img);
            
            fabricObj.add(image);
        } catch (e) {
            console.log(`Fail to add image.`, e);
        }
    }

    return (
        <div className="pdf-container">
            <div className="toolbar">
                <div className="tool">
                    <label className={'labelButton'} htmlFor={'pdf'}>Choose pdf</label>
                    <input
                      type="file"
                      name="pdf"
                      id="pdf"
                      onChange={onUploadPDF}
                      className="hidden"/>
                </div>
                <div className="tool">
                    <label className={'labelButton'} htmlFor={'image'}>Choose image</label>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      className="hidden"
                      onChange={onUploadImage}/>
                </div>
                <div className="tool">
                    <button className="tool-button">
                        <i className="fa fa-mouse-pointer"
                           title="Pointer"
                           onClick={onPointerClick}>
                        </i>
                    </button>
                </div>
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
            {pdfFile && <div className="pdf-content" style={{width: width}}>
                <Document
                  ref={docRef}
                  file={pdfFile}
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
            }
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
