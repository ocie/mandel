(function () {
    const drawingCanvas = document.getElementById('drawingCanvas')

    const NUM_WORKERS = 10

    let r0 = 0
    let i0 = 0
    let range = 3

    const ctx = drawingCanvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height)

    let workers = []
    for (let i = 0; i < NUM_WORKERS; i++) {
        workers[i] = new Worker('worker.js')
        workers[i].onmessage = function (e) {
            const data = e.data
            if (data.r0 != r0 || data.i0 != i0 || data.range != range) {
                return
            }

            for (let i = 0; i < data.width; i++) {
                const idx = 4 * (i + imageData.height * data.y)
                imageData.data[idx] =
                    imageData.data[idx + 1] =
                    imageData.data[idx + 2] = data.values[i] % 256
                imageData.data[idx + 3] = 255
            }
            ctx.putImageData(imageData, 0, 0)

        }
    }


    const mapToComplex = function (x, y) {
        const factor = range / Math.min(drawingCanvas.width, drawingCanvas.height)
        return [r0 + factor * (x - drawingCanvas.width / 2.0),
            i0 + factor * (y - drawingCanvas.height / 2.0)
        ]
    }

    const drawFigure = function () {

        for (let y = 0; y < imageData.width; y++) {
            const [re1, im] = mapToComplex(0, y)
            const re2 = mapToComplex(imageData.width - 1, y)[0]

            const request = {
                re1,
                re2,
                im,
                width: imageData.width,
                y,
                r0,
                i0,
                range,
                cycles: 2550
            }
            workers[y % NUM_WORKERS].postMessage(request)
        }
    }


    drawFigure()

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