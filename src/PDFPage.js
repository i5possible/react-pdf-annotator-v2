import React, {useState, useEffect, useRef} from 'react';

const PDFPage = (page) => {
    const canvas = useRef();

    useEffect(() => {
        // const context = canvas.getContext('2d')
        const viewport = page.getViewport({scale:1})
        console.log(viewport);
    }, [page])

    return <div>
        <canvas  ref={canvas}>

        </canvas>
    </div>
}

export default PDFPage;