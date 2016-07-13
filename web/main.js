window.define = System.amdDefine;
window.require = window.requirejs = System.amdRequire;

var PowerGrid = require('./powergrid');
var ArrayDataSource = require('./arraydatasource');
var JsonDataSource = require('./jsondatasource');
var GroupingDataSource = require('./datasources/groupingdatasource');
var SortingDataSource = require('./datasources/sortingdatasource');

var exports = module.exports = {};

exports.PowerGrid = PowerGrid;
exports.ArrayDataSource = ArrayDataSource;
exports.JsonDataSource = JsonDataSource;
exports.GroupingDataSource = GroupingDataSource;
exports.SortingDataSource = SortingDataSource;
