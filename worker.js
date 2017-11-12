const iterations = function(re,im,cycles) {
    let lr=0
    let li=0
    let lr2=0
    let li2=0
    for (let i=0 ; i< cycles; i++) {
        if (lr2+li2 > 4) {
            return i
        }
        lr2=lr*lr
        li2=li*li
        li=2*lr*li+im
        lr=lr2-li2+re
    }
    return cycles
}

onmessage = function(e) {
    const data = e.data
    values = []
    let factor = (data.re2-data.re1)/data.width

    for (let i=0; i<data.width; i++) {
        values[i]= iterations(data.re1+i*factor, data.im, data.cycles)        
    }
    data.values=values
    postMessage(data)
}