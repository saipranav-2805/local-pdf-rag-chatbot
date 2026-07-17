import { BaseChatModel } from '@langchain/core/language_models/chat_models';
/**
 * Load a chat model from a fully specified name.
 * @param fullySpecifiedName - String in the format 'provider/model' or 'provider/account/provider/model'.
 * @returns A Promise that resolves to a BaseChatModel instance.
 */
export declare function loadChatModel(fullySpecifiedName: string, temperature?: number): Promise<BaseChatModel>;
