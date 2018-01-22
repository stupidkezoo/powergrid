define(['../override', 'jquery', '../templates/nestedheaders.html'], function(override, $, nestedHeaderTemplate) {
    "use strict";
 
     return {
         init: function(grid, pluginOptions) {
 
             var groups = [];
             var groupTitles = [];
             var gridElement = $(grid.target);
 
             function adjustColumns(groups, afterAdjustFunction) {
                 groups.forEach(function(groupName, index) {
 
                     var groupTitle = groupTitles[index];
                     var groupClass = "." + groupName;
                     var totalWidth = 0;
                     var firstColumnPos;
                     $(groupClass).each(function(index) {
                         if (index == 0) {
                             firstColumnPos = $(this).position();
                         }
                         totalWidth += parseInt($(this).outerWidth(), 10);
                         var height = $(this).height();
                         $(this).css("top", height + "px");
                     });
 
                     if (!firstColumnPos) {
                         firstColumnPos = 0;
                     }
 
                     if (afterAdjustFunction != undefined) {
                         afterAdjustFunction(groupName, groupTitle, totalWidth, firstColumnPos);
                     }
 
                     var groupElement = gridElement.find(".pg-columnheader-" + groupName);
                     groupElement.css("width", totalWidth + "px");
                     groupElement.css("left", firstColumnPos.left + "px");
 
                 });
             }
 
             function groupingEnabled() {
                 return groups.length > 0;
             }
 
             override(grid, function($super) {
                 return {
                     init: function() {
 
                         for(var y = 0; y < this.options.columns.length; y++) {
                             var column = this.options.columns[y];
 
                             var group = column.group;
                             if (group !=undefined && !groups.includes(group)) {
                                 groups.push(column.group);
                                 groupTitles.push(column.groupTitle);
                             }
 
                         }
 
                         $super.init();
 
                         // Disable moving for now. The group should be able to move.
                         for(var y = 0; y < this.options.columns.length; y++) {
                             var column = this.options.columns[y];
                             column.allowMoving = false;
                         }
 
                         if (groupingEnabled()) {
                             adjustColumns(groups, function(groupName, groupTitle, totalWidth, firstColumnPos) {
                                 var groupDiv = $.templates(nestedHeaderTemplate).render({ groupName: groupName, groupTitle: groupTitle });
                                 gridElement.find("." + groupName).wrapAll("<div class='pg-columnheader-nested' />").parent().prepend(groupDiv);
                             });
                         }
 
 
 
                     },
                     adjustWidths: function(temporary) {
                         $super.adjustWidths(temporary);
                         if (groupingEnabled()) {
                             adjustColumns(groups);
                         }
                     },
                     renderHeaderCell: function(column, y) {
 
                         var renderedColumn =  $super.renderHeaderCell(column, y);
                         if (groupingEnabled()) {
                             if(!(y < this.options.frozenColumnsLeft) && !(y > this.options.columns.length - this.options.frozenColumnsRight - 1)) {
                                 renderedColumn.addClass(column.group);
                             }
 
                             return renderedColumn;
                         }
                         return renderedColumn;
                     },
                     headerHeight: function headerHeight() {
                         if (groupingEnabled()) {
                             var newHeight = $super.headerHeight() * 2;
                             return newHeight;
                         }
 
                         return $super.headerHeight();
                     }
                 }
             });
         }
     }
 
 });