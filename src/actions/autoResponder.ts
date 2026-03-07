import { Action } from './types.js';

export const autoResponderAction: Action = {
    name: 'Auto Responder',
    description: 'Automatically responds to comments containing a specific keyword.',

    async handleNewComment(commentView) {
        const content = commentView.comment.content.toLowerCase();
        if (content.includes('!ping')) {
            console.log(`[AutoResponder] Replying to comment ${commentView.comment.id} with 'Pong!'`);
            // Scaffold: Here you would call lemmyClient.createComment({ 
            //   content: 'Pong!', 
            //   post_id: commentView.comment.post_id,
            //   parent_id: commentView.comment.id
            // })
        }
    }
};
