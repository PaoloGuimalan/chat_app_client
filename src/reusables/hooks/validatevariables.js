const checkIfValid = (array) => {
    var notValidCount = 0;
    array.map((vars, i) => {
        if(vars.trim() == ""){
            notValidCount += 1
        }
    })

    return notValidCount > 0? false : true
}

export {
    checkIfValid
}