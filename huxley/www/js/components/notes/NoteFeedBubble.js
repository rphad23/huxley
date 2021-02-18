/**
 * Copyright (c) 2011-2021 Berkeley Model United Nations. All rights reserved.
 * Use of this source code is governed by a BSD License (see LICENSE).
 */

//@flow

"use strict";

import React from "react";
import type { Note } from "utils/types";

const { Button } = require("components/core/Button");
const { TextTemplate } = require("components/core/TextTemplate");
const { NoteStore } = require("stores/NoteStore");

// $FlowFixMe
require("css/notes/NoteFeedBubble.less");

type NoteFeedBubbleProps = {
  countries: { [number]: string },
  note: Note,
};

type NoteFeedBubbleState = {
  hover: boolean,
};

class NoteFeedBubble extends React.Component<
  NoteFeedBubbleProps,
  NoteFeedBubbleState
> {
  constructor(props: NoteFeedBubbleProps) {
    super(props);
    this.state = {
      hover: false,
    };
  }

  messageBox: ?HTMLDivElement;
  render(): React$Element<any> {
    return (
      <div
        className="messageContainer"
        onMouseOver={this._onMouseOver}
        onMouseOut={this._onMouseOut}
      >
        <div className="feedMessage">{this.props.note.msg}</div>
        {this.state.hover ? this.renderNoteInfo() : null}
      </div>
    );
  }

  renderNoteInfo: () => React$Element<any> = () => {
    const date_map = {
        "0": "Sun. ",
        "1": "Mon. ",
        "2": "Tues. ",
        "3": "Wed. ",
        "4": "Thurs. ",
        "5": "Fri. ",
        "6": "Sat. ",
    }
    const sender_name = this.props.note.sender
      ? this.props.countries[this.props.note.sender]
      : "Chair";
    const recipient_name = this.props.note.recipient
      ? this.props.countries[this.props.note.recipient]
      : "Chair";
    const date = new Date(this.props.note.timestamp * 1000);
    const timestamp = date_map[date.getDay().toString()] + date.toLocaleTimeString('en-US');
    return (
      <div className="feedMessageInfo">
        <strong>{sender_name} -> {recipient_name}</strong> [{timestamp}]
      </div>
    );
  };

  _onMouseOver: (SyntheticEvent<any>) => void = (event) => {
    this.setState({ hover: true });
  };

  _onMouseOut: (SyntheticEvent<any>) => void = (event) => {
    this.setState({ hover: false });
  };
}

export { NoteFeedBubble };
