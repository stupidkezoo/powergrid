import React from 'react';
import { render } from 'react-dom';
import $ from 'jquery';
import PowerGrid from './powergrid';

require('./powergrid.css');

var numbers = (function(s){var l,x=[];while(s>(l=x.length))x[l]=l;return x})(20);

var columns = numbers.map(function(e) {
  return {
    title: 'Column ' + e,
    width: e==0?150:e==6?250:100,
    editable: e > 5 && e < 10
  };
});

var data = new Array(25);

var datasource = {
  recordCount: function() {
    return data.length;
  },

  getRowByIndex: function(idx) {
    if(data[idx] === undefined) {
      var row = columns.map(function(e,i) {
        return 'Cell ' + idx + ', ' + i;
      });
      row.id = idx + '';
      return data[idx] = row;
    } else {
      return data[idx];
    }
  },

  getRecordById: function(id) {
    return this.getRowByIndex(parseInt(id));
  },

  getData: function(start, end) {
    if(!start) start = 0;
    if(!end) end = this.recordCount();
    var d = new Array(end-start);
    for(var x = start; x < end; x++) {
      d[x-start] = this.getRowByIndex(x);
    }
    return d;
  },

  setValue: function(rowIdx, key, value) {
    data[rowIdx][key] = value;
  },

  isReady: function() {
    return true;
  }
};



const PowergridContainer = React.createClass({

  propTypes: {
        columns: React.PropTypes.array.isRequired,
        datasource: React.PropTypes.object.isRequired,
        rootId: React.PropTypes.string.isRequired
    },

  componentDidMount() {
    $('#' + this.props.rootId).PowerGrid({
      columns: this.props.columns,

      frozenColumnsLeft: 4,
      frozenColumnsRight: 2,

      frozenRowsTop: 2,
      frozenRowsBottom: 1,

      dataSource: this.props.datasource,

      extensions: {
        'columnsizing': {},
        'columnmoving': {},
        'editing': true
      }
    });
  },
  render() {
    return <div id={this.props.rootId}></div>
  }
});

var mainComponent =
<form action= 'error.html'>
    <PowergridContainer key='blup' rootId='powergrid' datasource={datasource} columns={columns}></PowergridContainer>
    <input key='submit' type='submit' value='submit'></input>
</form>

render(mainComponent, document.getElementById('root'));
