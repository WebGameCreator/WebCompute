const [{ ComputeShader }, device, shader] = await Promise.all([
    import("./modules/compute-shader.js"),
    navigator.gpu?.requestAdapter?.()?.then(adapter => adapter?.requestDevice?.()),
    fetch("./shader.wgsl").then(res => res.text())
]);
if (device == null) alert("Your browser does not support WebGPU");

const bufferSize = 1024;
const boidSize = 8;

const pipeline = new ComputeShader(device, shader, [
    {
        name: "position",
        size: bufferSize,
        dataType: Float32Array,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        type: "storage"
    },
    {
        name: "velocity",
        size: bufferSize,
        dataType: Float32Array,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        type: "storage"
    },
    {
        name: "positionOutput",
        size: bufferSize,
        dataType: Float32Array,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    },
    {
        name: "velocityOutput",
        size: bufferSize,
        dataType: Float32Array,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    }
]);

const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

pipeline.position.write(new Array(bufferSize).fill().map(() => Math.random() * 2 - 1));
pipeline.velocity.write(new Array(bufferSize).fill().map(() => Math.random() * 2 - 1));

(async function loop() {
    pipeline.compute(8, 1, 1, [{ src: "position", dst: "positionOutput" }, { src: "velocity", dst: "velocityOutput" }]);
    const [positions, velocities] = await Promise.all([
        pipeline.positionOutput.read(),
        pipeline.velocityOutput.read()
    ]);
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.width);
    ctx.globalAlpha = 1.0;
    for (let i = 0; i < positions.length; i += 2) {
        ctx.beginPath();
        ctx.arc((positions[i] * 0.5 + 0.5) * canvas.width, (positions[i + 1] * 0.5 + 0.5) * canvas.height, boidSize, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${(performance.now() * 0.05 + 180 * Math.atan2(velocities[i], velocities[i + 1]) / Math.PI) % 360} 100 50)`;
        ctx.fill();
    }
    requestAnimationFrame(loop);
})();
