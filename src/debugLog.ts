export default (...args) => {
    if (process.env.DEBUG) {
        console.log(...args)
    }
}
