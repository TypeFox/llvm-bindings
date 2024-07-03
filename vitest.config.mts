//import { defineConfig } from "vitest/config"

export default /*defineConfig*/({
    test: {
        deps: {
            interopDefault: true
        },
        include: ['**/*.{test,spec}.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],
        globals: true,
        typecheck: {
            //enabled: false
        },
        poolOptions: {
            threads: {
                singleThread: true
            }
        }
    }
});