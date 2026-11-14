import fs from 'node:fs'
import Ajv from 'ajv'
const data = JSON.parse(fs.readFileSync(new URL('../src/data/missions.json', import.meta.url), 'utf8'))
const schema = JSON.parse(fs.readFileSync(new URL('./mission.schema.json', import.meta.url), 'utf8'))
const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(schema)
if (!validate(data)) {
  console.error('Mission data validation failed:')
  console.error(validate.errors)
  process.exit(1)
}
const ids = new Set()
for (const mission of data) {
  if (ids.has(mission.id)) throw new Error(`Duplicate mission id: ${mission.id}`)
  ids.add(mission.id)
  for (const claim of mission.evidence) {
    if (!claim.source) throw new Error(`Evidence missing source in ${mission.id}`)
  }
}
console.log(`✓ Validated ${data.length} mission records against mission.schema.json`)
