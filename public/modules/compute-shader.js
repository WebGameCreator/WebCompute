export class ComputeShader {
    #device;
    #pipe;
    #bindGroup;
    #buffers;
    constructor(device, code, bufferConfigs) {
        this.#device = device;
        const { bindGroupEntries, bindGroupLayoutEntries } = this.#createBuffers(bufferConfigs);
        const bindGroupLayout = this.#device.createBindGroupLayout({
            entries: bindGroupLayoutEntries
        });
        this.#bindGroup = this.#device.createBindGroup({
            layout: bindGroupLayout,
            entries: bindGroupEntries
        });
        this.#pipe = this.#device.createComputePipeline({
            layout: this.#device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout],
            }),
            compute: { module: this.#device.createShaderModule({ code }) }
        });
    }
    #createBuffers(bufferConfigs) {
        this.#buffers = {};
        const bindGroupEntries = [];
        const bindGroupLayoutEntries = [];
        for (const bufferConfig of bufferConfigs) {
            const buffer = this.#device.createBuffer({
                size: bufferConfig.size * bufferConfig.dataType.BYTES_PER_ELEMENT,
                usage: bufferConfig.usage
            });
            this.#buffers[bufferConfig.name] = buffer;
            this[bufferConfig.name] = {
                read: async () => {
                    await buffer.mapAsync(GPUMapMode.READ);
                    const output = Array.from(new bufferConfig.dataType(buffer.getMappedRange()));
                    buffer.unmap();
                    return output;
                },
                write: (value) => {
                    this.#device.queue.writeBuffer(
                        buffer,
                        0,
                        new bufferConfig.dataType(value)
                    );
                }
            };
            if (bufferConfig.type == null) continue;
            bindGroupEntries.push({
                binding: bindGroupEntries.length,
                resource: { buffer }
            });
            bindGroupLayoutEntries.push({
                binding: bindGroupLayoutEntries.length,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: bufferConfig.type,
                }
            });
        }
        return { bindGroupEntries, bindGroupLayoutEntries };
    }
    compute(x = 1, y = 1, z = 1, outputs) {
        const commandEncoder = this.#device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.#pipe);
        passEncoder.setBindGroup(0, this.#bindGroup);
        passEncoder.dispatchWorkgroups(x, y, z);
        passEncoder.end();
        for (const output of outputs) {
            commandEncoder.copyBufferToBuffer(this.#buffers[output.src], 0, this.#buffers[output.dst], 0, this.#buffers[output.dst].size);
        }
        this.#device.queue.submit([commandEncoder.finish()]);
    }
}
