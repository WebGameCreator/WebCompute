@binding(0) @group(0) var<storage, read_write> positions : array<vec2<f32>>;
@binding(1) @group(0) var<storage, read_write> velocities : array<vec2<f32>>;

const cohesionDistance: f32 = 4.0;
const separationDistance: f32 = 0.03;
const alignmentDistance: f32 = 0.03;

const cohesionScale: f32 = 0.003;
const separationScale: f32 = 0.03;
const alignmentScale: f32 = 0.04;

const deltaT: f32 = 0.1;

@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3u) {
  var index = GlobalInvocationID.x;

  var vPos = positions[index];
  var vVel = velocities[index];
  var cMass = vec2(0.0);
  var cVel = vec2(0.0);
  var colVel = vec2(0.0);
  var cMassCount = 0u;
  var cVelCount = 0u;
  var pos : vec2f;
  var vel : vec2f;

  for (var i = 0u; i < arrayLength(&positions); i++) {
    if (i == index) {
      continue;
    }

    pos = positions[i].xy;
    vel = velocities[i].xy;
    if (distance(pos, vPos) < cohesionDistance) {
      cMass += pos;
      cMassCount++;
    }
    if (distance(pos, vPos) < separationDistance) {
      colVel -= pos - vPos;
    }
    if (distance(pos, vPos) < alignmentDistance) {
      cVel += vel;
      cVelCount++;
    }
  }
  if (cMassCount > 0) {
    cMass = (cMass / vec2(f32(cMassCount))) - vPos;
  }
  if (cVelCount > 0) {
    cVel /= f32(cVelCount);
  }
  vVel += (cMass * cohesionScale) + (colVel * separationScale) + (cVel * alignmentScale);

  // clamp velocity for a more pleasing simulation
  vVel = normalize(vVel) * clamp(length(vVel), 0.0, 0.1);
  // kinematic update
  vPos = vPos + (vVel * deltaT);
  // Wrap around boundary
  if (vPos.x < -1.0) {
    vPos.x += 2.0;
  }
  if (vPos.x > 1.0) {
    vPos.x -= 2.0;
  }
  if (vPos.y < -1.0) {
    vPos.y += 2.0;
  }
  if (vPos.y > 1.0) {
    vPos.y -= 2.0;
  }
  // Write back
  positions[index] = vPos;
  velocities[index] = vVel;
}
