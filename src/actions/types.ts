import { CommentView, PostView } from 'lemmy-js-client';

export interface Action {
    name: string;
    description: string;
    handleNewPost?(postView: PostView): Promise<void>;
    handleNewComment?(commentView: CommentView): Promise<void>;
}
