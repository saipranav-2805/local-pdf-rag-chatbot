/**
 * This "graph" simply exposes an endpoint for a user to upload docs to be indexed.
 */
export declare const graph: import("@langchain/langgraph").CompiledStateGraph<import("@langchain/langgraph").StateType<{
    docs: import("@langchain/langgraph").BinaryOperatorAggregate<import("@langchain/core/documents").Document<Record<string, any>>[], string | import("@langchain/core/documents").Document<Record<string, any>>[] | string[] | {
        [key: string]: any;
    }[]>;
}>, import("@langchain/langgraph").UpdateType<{
    docs: import("@langchain/langgraph").BinaryOperatorAggregate<import("@langchain/core/documents").Document<Record<string, any>>[], string | import("@langchain/core/documents").Document<Record<string, any>>[] | string[] | {
        [key: string]: any;
    }[]>;
}>, "__start__" | "ingestDocs", {
    docs: import("@langchain/langgraph").BinaryOperatorAggregate<import("@langchain/core/documents").Document<Record<string, any>>[], string | import("@langchain/core/documents").Document<Record<string, any>>[] | string[] | {
        [key: string]: any;
    }[]>;
}, {
    docs: import("@langchain/langgraph").BinaryOperatorAggregate<import("@langchain/core/documents").Document<Record<string, any>>[], string | import("@langchain/core/documents").Document<Record<string, any>>[] | string[] | {
        [key: string]: any;
    }[]>;
}, {
    docsFile: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<S>;
    };
    useSampleDocs: {
        (): import("@langchain/langgraph").LastValue<boolean>;
        (annotation: import("@langchain/langgraph").SingleReducer<boolean, boolean>): import("@langchain/langgraph").BinaryOperatorAggregate<boolean, boolean>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<S>;
    };
    retrieverProvider: {
        (): import("@langchain/langgraph").LastValue<"supabase">;
        (annotation: import("@langchain/langgraph").SingleReducer<"supabase", "supabase">): import("@langchain/langgraph").BinaryOperatorAggregate<"supabase", "supabase">;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<S>;
    };
    filterKwargs: {
        (): import("@langchain/langgraph").LastValue<Record<string, any>>;
        (annotation: import("@langchain/langgraph").SingleReducer<Record<string, any>, Record<string, any>>): import("@langchain/langgraph").BinaryOperatorAggregate<Record<string, any>, Record<string, any>>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<S>;
    };
    k: {
        (): import("@langchain/langgraph").LastValue<number>;
        (annotation: import("@langchain/langgraph").SingleReducer<number, number>): import("@langchain/langgraph").BinaryOperatorAggregate<number, number>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<S>;
    };
}>;
