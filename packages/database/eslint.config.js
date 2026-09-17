import { config } from "@workspace/eslint-config/base"

export default [...config, { ignores: ["convex/_generated/**"] }]
