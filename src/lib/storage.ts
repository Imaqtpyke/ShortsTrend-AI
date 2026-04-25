import localforage from 'localforage';
import { AppState } from '../types';

// Explicit driver list improves reliability on Capacitor/Android WebViews
// which can silently fail during automatic driver detection.
localforage.config({
    name: 'ShortsTrendAI',
    storeName: 'app_state',
    driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE]
});

const SESSION_KEY = 'shorts_trend_session';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface PersistedSession {
    analysis: AppState['analysis'];
    contentIdea: AppState['contentIdea'];
    critique: AppState['critique'];
    workflow: AppState['workflow'];
    searchQuery: string;
    segmentMode: 'adjustable' | 'fixed';
    useCustomCharacter: boolean;
    customCharacter: AppState['customCharacter'];
    selectedGenre: AppState['selectedGenre'];
    useCustomGenre: AppState['useCustomGenre'];
    customGenreString: AppState['customGenreString'];
    useCustomStyle: AppState['useCustomStyle'];

    searchMode: AppState['searchMode'];
    youtubeUrl: string;
    directIdea: string;
    activeTab: 'trends' | 'generator' | 'critique' | 'workflow' | 'history';
    savedAt: number;
}

export const persistSession = Object.assign(
    async (partial: Partial<PersistedSession>) => {
        try {
            const raw = await localforage.getItem<string>(SESSION_KEY);
            let current: Partial<PersistedSession> = {};
            if (raw) current = JSON.parse(raw);

            const next: PersistedSession = {
                analysis: partial.analysis !== undefined ? partial.analysis : current.analysis ?? null,
                contentIdea: partial.contentIdea !== undefined ? partial.contentIdea : current.contentIdea ?? null,
                critique: partial.critique !== undefined ? partial.critique : current.critique ?? null,
                workflow: partial.workflow !== undefined ? partial.workflow : current.workflow ?? null,
                searchQuery: partial.searchQuery !== undefined ? partial.searchQuery : current.searchQuery ?? '',
                segmentMode: partial.segmentMode !== undefined ? partial.segmentMode : (current.segmentMode ?? 'adjustable'),
                useCustomCharacter: partial.useCustomCharacter !== undefined ? partial.useCustomCharacter : (current.useCustomCharacter ?? false),
                customCharacter: partial.customCharacter !== undefined ? partial.customCharacter : (current.customCharacter ?? { name: '', description: '', type: 'both' }),
                selectedGenre: partial.selectedGenre !== undefined ? partial.selectedGenre : (current.selectedGenre ?? 'Storytelling'),
                useCustomGenre: partial.useCustomGenre !== undefined ? partial.useCustomGenre : (current.useCustomGenre ?? false),
                customGenreString: partial.customGenreString !== undefined ? partial.customGenreString : (current.customGenreString ?? ''),
                useCustomStyle: partial.useCustomStyle !== undefined ? partial.useCustomStyle : (current.useCustomStyle ?? false),

                searchMode: partial.searchMode !== undefined ? partial.searchMode : (current.searchMode ?? 'keyword'),
                youtubeUrl: partial.youtubeUrl !== undefined ? partial.youtubeUrl : (current.youtubeUrl ?? ''),
                directIdea: partial.directIdea !== undefined ? partial.directIdea : (current.directIdea ?? ''),
                activeTab: partial.activeTab !== undefined ? partial.activeTab : (current.activeTab ?? 'trends'),
                savedAt: Date.now(),
            };
            await localforage.setItem(SESSION_KEY, JSON.stringify(next));
        } catch (e) {
            console.error("Failed to persist session to localforage", e);
        }
    },
    {
        load: async (): Promise<Partial<PersistedSession>> => {
            const rawSession = await localforage.getItem<string>(SESSION_KEY);
            let session: Partial<PersistedSession> = {};
            if (rawSession) {
                try {
                    const parsed: PersistedSession = JSON.parse(rawSession);
                    if (Date.now() - parsed.savedAt <= SESSION_MAX_AGE_MS) {
                        session = parsed;
                    } else {
                        await localforage.removeItem(SESSION_KEY);
                    }
                } catch (e) {
                    console.error("Corrupted session data, clearing...", e);
                    await localforage.removeItem(SESSION_KEY);
                }
            }
            return session;
        }
    }
);

export async function clearSession() {
    try {
        await localforage.removeItem(SESSION_KEY);
    } catch (e) {
        console.error("Failed to clear session from localforage", e);
    }
}
