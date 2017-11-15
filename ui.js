(function () {
    const drawingCanvas = document.getElementById('drawingCanvas')

    const resize = () => {
        drawingCanvas.width = drawingCanvas.clientWidth
        drawingCanvas.height = drawingCanvas.clientHeight
        ctx = drawingCanvas.getContext('2d')
        imageData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height)
    }

    let queue=[]
    let ctx
    let imageData

    resize()

    window.onresize = () => {
        resize()
        drawFigure()
    }

    const NUM_WORKERS = 10

    let r0 = 0
    let i0 = 0
    let range = 3
    let cycles = 2550

    let clut = []
    for (var i=0; i<256; i++) {
        clut[i]=[Math.floor(Math.random()*256),
            Math.floor(Math.random()*256),
            Math.floor(Math.random()*256)]
    }

    let workers = []
    for (let i = 0; i < NUM_WORKERS; i++) {
        workers[i] = new Worker('worker.js')
        workers[i].onmessage = function (e) {
            const data = e.data
            if (data.r0 != r0 || data.i0 != i0 || data.range != range || data.height != imageData.height || data.width != imageData.width) {
                return
            }

            for (let i = 0; i < data.width; i++) {
                const idx = 4 * (i + imageData.width * data.y)
                const iterations = data.values[i]

                if (iterations == cycles) {
                    [imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2]] = [0,0,0]                    
                } else {
                    [imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2]] = clut[iterations % 256]
                }
                imageData.data[idx + 3] = 255
            }

            if (queue.length % 50 == 0) {
                ctx.putImageData(imageData, 0, 0)
            }

            if (queue.length>0) {
                workers[i].postMessage(queue.pop())
            }
        }
    }


    const mapToComplex = function (x, y) {
        const factor = range / Math.min(drawingCanvas.width, drawingCanvas.height)
        return [r0 + factor * (x - drawingCanvas.width / 2.0),
            i0 + factor * (y - drawingCanvas.height / 2.0)
        ]
    }

    const drawFigure = function () {

        queue=[]

        for (let y = imageData.height; y>=0; y--) {
            const [re1, im] = mapToComplex(0, y)
            const re2 = mapToComplex(imageData.width - 1, y)[0]

            queue.push({
                re1,
                re2,
                im,
                width: imageData.width,
                height: imageData.height,
                y,
                r0,
                i0,
                range,
                cycles
            })
        }

        for (let i=0;i<NUM_WORKERS;i++) {
            workers[i].postMessage(queue.pop())            
        }
    }


    document.addEventListener('DOMContentLoaded', drawFigure)

    drawingCanvas.addEventListener('click', e => {
        const x = e.pageX - drawingCanvas.offsetLeft
        const y = e.pageY - drawingCanvas.offsetTop

        const [re, im] = mapToComplex(x, y)
        r0 = re
        i0 = im
        range = range * .75
        drawFigure()
    })
})()