declare const _default: {
    preset: string;
    testEnvironment: string;
    extensionsToTreatAsEsm: string[];
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': string;
    };
    transform: {
        '^.+\\.tsx?$': ["ts-jest", {
            useESM: true;
        }];
    };
    testMatch: string[];
    collectCoverageFrom: string[];
    coveragePathIgnorePatterns: string[];
    coverageThreshold: {
        global: {
            branches: number;
            functions: number;
            lines: number;
            statements: number;
        };
    };
    coverageDirectory: string;
    verbose: true;
};
export default _default;
