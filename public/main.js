const [{ ComputeShader }, device, shader] = await Promise.all([
    import("./modules/compute-shader.js"),
    navigator.gpu?.requestAdapter?.()?.then(adapter => adapter?.requestDevice?.()),
    fetch("./shader.wgsl").then(res => res.text())
]);
if (device == null) console.error("Your browser does not support WebGPU");

const bufferSize = 3;

const pipeline = new ComputeShader(device, shader, [
    {
        name: "input",
        size: bufferSize,
        dataType: Float32Array,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        type: "storage"
    },
    {
        name: "output",
        size: bufferSize,
        dataType: Float32Array,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    }
]);

pipeline.input.write([1, 2, 3]);
pipeline.compute(bufferSize);
pipeline.copy("input", "output");

console.log(await pipeline.output.read());
