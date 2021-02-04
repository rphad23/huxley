/**
 * Copyright (c) 2011-2021 Berkeley Model United Nations. All rights reserved.
 * Use of this source code is governed by a BSD License (see LICENSE).
 +*/

 //@flow

'use strict';

import React from "react";
import { history } from "utils/history";

const { AssignmentStore } = require('stores/AssignmentStore');
const { Button } = require('components/core/Button');
const { CountryStore } = require('stores/CountryStore');
const { CurrentUserStore } = require('stores/CurrentUserStore');
const { InnerView } = require('components/InnerView');
const { TextTemplate } = require('components/core/TextTemplate');
const { User } = require('utils/User');
const { NoteConversation } = require('components/notes/NoteConversation');
const { NoteConversationSelector } = require('components/notes/NoteConversationSelector');
const { NoteStore } = require('stores/NoteStore');


const { ServerAPI } = require('lib/ServerAPI');

type DelegateNoteViewState = {
  conversation: Array<any>,
  recipient: any,
  sender: any,
  assignments: Array<any>,
  countries: any
}

class DelegateNoteView extends React.Component<{}, DelegateNoteViewState> {
  constructor(props : {}) {
    super(props);
    const user = CurrentUserStore.getCurrentUser();
    const user_assignment = user.delegate.assignment;
    const conversation = NoteStore.getConversationNotes(user_assignment.id, null, true);
    console.log(user_assignment.committee);
    const assignments = AssignmentStore.getCommitteeAssignments(user_assignment.committee.id);
    const countries = CountryStore.getCountries();

    this.state = {
      conversation: conversation,
      recipient: null,
      sender: user_assignment,
      assignments: assignments,
      countries: countries
    };
  }


  UNSAFE_componentWillMount() {
    var user = CurrentUserStore.getCurrentUser();
    if (!User.isDelegate(user)) {
      history.redirect("/");
    }
  }

  componentDidMount() {
    // $FlowFixMe
    this._conversationToken = NoteStore.addListener(() => {
      console.log('test1')
      this.setState({
        conversation: NoteStore.getConversationNotes(this.state.sender.id, null, true),
      });
      console.log(this.state.conversation);
    });

    // $FlowFixMe
    this._assignmentToken = AssignmentStore.addListener(() => {
      console.log('test');
      this.setState({
        assignments: AssignmentStore.getCommitteeAssignments(this.state.sender.committee.id),
      });
    });

    // $FlowFixMe
    this._countryToken = CountryStore.addListener(() => {
      console.log('test');
      this.setState({
        countries: CountryStore.getCountries(),
      });
    });
  }

  componentWillUnmount() {
    // $FlowFixMe
    this._conversationToken && this._conversationToken.remove();
    // $FlowFixMe
    this._assignmentToken && this._assignmentToken.remove();
    // $FlowFixMe
    this._countryToken && this._countryToken.remove();
  }

  render() : any {
    const assignment_map = {};
    if (this.state.assignments.length && Object.keys(this.state.countries).length) {
      for (let assignment of this.state.assignments) {
        assignment_map[this.state.countries[assignment.country].name] = assignment;
      }
    }
    return (
      <InnerView>
        <table width={'100%'}>
          <tbody>
            <tr>
              <td width={'20%'}>
                <NoteConversationSelector assignments={assignment_map} onChairConversationChange={this._onChairConversationChange}
                  onConversationChange={this._onConversationChange} />
              </td>
              <td width={'80%'}>
                <NoteConversation 
                    sender_id={this.state.sender.id} 
                    recipient_id={this.state.recipient ? this.state.recipient.id : null} 
                    is_chair={this.state.recipient ? '0' : '2'} 
                    conversation={this.state.conversation} 
                />
              </td>
            </tr>
          </tbody>
        </table>
      </InnerView>)
  }

  _onChairConversationChange: () => void = () => {
    this.setState({ conversation: NoteStore.getConversationNotes(this.state.sender.id, null, true), recipient: null })
    console.log(this.state.conversation);
    console.log('hi!!!');
  }

  _onConversationChange: (any) => void = (recipient) => {
    this.setState({ conversation: NoteStore.getConversationNotes(this.state.sender.id, recipient.id, false), recipient: recipient })
    console.log(this.state.conversation);
    console.log('hi - for for a delegate!!!');
    console.log(recipient);
  }
};

export { DelegateNoteView };
