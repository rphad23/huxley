/**
 * Copyright (c) 2011-2021 Berkeley Model United Nations. All rights reserved.
 * Use of this source code is governed by a BSD License (see LICENSE).
 */

'use strict';

import ActionConstants from 'constants/ActionConstants';
import { CurrentUserStore } from "stores/CurrentUserStore";
import { NoteActions } from "actions/NoteActions";
import { Dispatcher } from "dispatcher/Dispatcher";
import { ServerAPI } from "lib/ServerAPI";
import { Store } from "flux/utils";

let _notes = {};
let _notesFetched = false; // TODO: remove this, it's not necessary anymore probably
let _lastFetchedTimestamp = 0;
let _previousUserID = -1;

class NoteStore extends Store {
  getCommitteeNotes(committeeID) {
    let noteIDs = Object.keys(_notes);
    if (_lastFetchedTimestamp < Date.now() - 1000) { // TODO: modify committee retrieval so that it's also timestamp based
      ServerAPI.getNotesByCommitteee(committeeID).then(value => 
        NoteActions.notesFetched(value)
      );

      // return [];
    }

    return noteIDs.map(id => _notes[id]);
  }

  getConversationNotes(senderID, recipientID, chair) {
    let noteIDs;
    // Subtracting 1s to ensure that polling the server doesn't always happen / there's no bad mutual recursion
    // Note: this might have issues on slower connections
    // TOOD: look into better ways to ensure loading is finished
    if (_lastFetchedTimestamp < Date.now() - 1000) {
      ServerAPI.getNotesBySender(senderID, _lastFetchedTimestamp).then(value => 
        NoteActions.notesFetched(value));
        // if (chair) {
        //     ServerAPI.getNotesByConversationWithChair(senderID).then(value => 
        //         NoteActions.notesFetched(value)
        //     );
        // } else {
        //     ServerAPI.getNotesByConversation(senderID, recipientID).then(value => 
        //         NoteActions.notesFetched(value)
        //     );
        // }
      
      // Commented out because we do want to show the notes that already exist and avoid re-rendering a ton
      // return [];
    }
    if (chair) {
      noteIDs = Object.keys(_notes).filter((noteID) => 
                  (_notes[noteID].sender == senderID && _notes[noteID].is_chair == 2) ||
                  (_notes[noteID].is_chair == 1 && _notes[noteID].recipient == senderID));
    } else {
      noteIDs = Object.keys(_notes).filter((noteID) => 
                  (_notes[noteID].sender == senderID && _notes[noteID].recipient == recipientID) ||
                  (_notes[noteID].sender == recipientID && _notes[noteID].recipient == senderID));
    }
    return noteIDs.map(id => _notes[id]);
  }

  addNote(note) {
    _notes[note.id] = note;
  }

  __onDispatch(action) {
    switch (action.actionType) {
      case ActionConstants.ADD_NOTE:
        this.addNote(action.note);
        break;
      case ActionConstants.NOTES_FETCHED:
        for (const note of action.notes) {
          _notes[note.id] = note;
        }
        // subtracting 1000ms to ensure that no notes are missed in the time it takes the server to communicate with the client
        _lastFetchedTimestamp = Date.now() - 1000; 
        _notesFetched = true;
        break;
      case ActionConstants.LOGIN:
        var userID = CurrentUserStore.getCurrentUser().id;
        if (userID != _previousUserID) {
          _notes = {};
          _notesFetched = false;
          _lastFetchedTimestamp = 0;
          _previousUserID = userID;
        }
        break;
      default:
        return;
    }

    this.__emitChange();
  }
}

const noteStore = new NoteStore(Dispatcher);
export { noteStore as NoteStore };
