const checkIfValid = (array: any[]) => {
    var notValidCount = 0;
    array.map((vars: any) => {
        if(vars.trim() == ""){
            notValidCount += 1
        }
    })

    return notValidCount > 0? false : true
}

export {
    checkIfValid
}