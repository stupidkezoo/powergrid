define(['override', 'jquery', 'text!../templates/filterPane.html', 'text!../templates/filterBox.html'], function(override, $, filterPane, filterBox) {

    function FilteringDataSource(delegate) {
        var self = this;
        this.delegate = delegate;

        $(delegate).on('dataloaded', function(event) {
            self.reload();
            $(self).trigger('dataloaded');
        }).on('datachanged', function(event, data) {
            self.reload();
            $(self).trigger('datachanged', [data]);
        });

        if(delegate.isReady()) {
            this.reload();
        }

        if(typeof delegate.sort === 'function') {
            this.sort = delegate.sort.bind(delegate);
        }
    }

    FilteringDataSource.prototype = {
        view: null,

        isReady: function() {
            return this.view != null;
        },

        reload: function() {
            this.delegate.assertReady();
            this.view = this.delegate.getData();
        },

        recordCount: function() {
            this.assertReady();
            return this.view.length;
        },

        getData: function(start, end) {
            this.assertReady();
            if(!start && !end) return this.view;
            if(!start) start = 0;
            if(!end) end = this.recordCount();
            return this.view.slice(start, end);
        },

        setValue: function(rowId, key, value) {
            this.delegate.setValue(rowId, key, value);
        },

        assertReady: function() {
            if(!this.isReady()) throw Error('Datasource not ready yet');
        },

        buildStatistics: function() {
            return {
                actualRecordCount: this.delegate && this.delegate.recordCount()
            };
        },

        applyFilter: function(settings, filter) {
            var oldview = this.view,
                view = this.delegate.getData().filter(filter);
            this.view = view;
            $(this).trigger('datachanged', { data: view, oldData: oldview });
        },

        getRecordById: function(id) {
            return this.delegate.getRecordById(id);
        },

        getInitialPagingSize: function() {
            return this.delegate.getInitialPagingSize();
        }
    };

    return {
        init: function(grid, pluginOptions) {
            override(grid, function($super) {
                var columnSettings = {};
                var ds = this.dataSource.datastore;
                var columnKeysWithSearchFormula=[];
                grid.columnKeysWithSearchFormula=columnKeysWithSearchFormula;
                var currentFilterPane;

                // Create an object to store the values that are selected in the grid
                // The object will contain a list of maps with the combination of the column.key and the selectedValues
                var selectedFilterValues = [];
                grid.selectedFilterValues=selectedFilterValues;

                function filterGridOnValue(timer, value, columnKey) {
                      if(timer) clearTimeout(timer);
                      function triggerFilter(){
                         grid.filtering.setColumnFilteringAttribute(columnKey, { 'value': value });
                         timer = null;
                      }
                      timer = setTimeout(triggerFilter, 1000);
                      return timer;
                }

                return {
                    init: function() {
                        if(typeof this.dataSource.applyFilter !== 'function') {
                            this.dataSource = new FilteringDataSource(this.dataSource);
                        }
                        var selectedStatus = this.selectedStatus;
                        $super.init();

                        grid.options.columns.forEach(function(column) {
                           if (column.searchFormula) {
                              ds.registerGlobalAttribute(column.key, 'searchFormula', column.searchFormula);
                              grid.columnKeysWithSearchFormula.push(column.key);
                           }
                        });

                        this.container.on('click', '.pg-filter', function(event) {
                            var $this = $(this),
                                key = $this.parents('.pg-columnheader').attr('data-column-key'),
                                column = grid.getColumnForKey(key);

                            if(currentFilterPane) {
                                grid.filtering.closeFilterPane();
                            }

                            grid.filtering.openFilterPane(column, $this.offset().top, $this.offset().left);

                            event.preventDefault();
                            event.stopPropagation();
                        });

                        $('body').on('click.' + this.id, function(event) {
                            if(currentFilterPane && $(this).parents('.pg-filter-pane').empty()) {
                               //If an item is selected for a multi-select the screen will not close
                               //A user has to click somewhere else to get the window closed.
                               if(event.target.getAttribute('data-filter-type')!=="exactValue"){
                                  grid.filtering.closeFilterPane();
                               }
                            }
                        });

                        this.container.on('click mousedown', '.pg-filter-box', function(event) {
                            event.stopPropagation();
                        });

                        var filterOptions = grid.loadSetting('filterParams');
                        if (filterOptions) {
                            columnSettings = filterOptions;
                            // When loading the grid, the filterParams are taken from the local Storage.
                            // Check if the filterParams are containing a column of the columns with a searchFormula
                            // If this is the case, add the values to the selectedFilterValues variable.
                            for(var i=0;i<grid.columnKeysWithSearchFormula.length;i++){
                                if(filterOptions[grid.columnKeysWithSearchFormula[i]] != undefined)
                                {
                                   var map = new Map();
                                   map[grid.columnKeysWithSearchFormula[i]] = filterOptions[grid.columnKeysWithSearchFormula[i]].value;
                                   grid.selectedFilterValues.push(map);
                                }
                            }
                        }
                    },

                    destroy: function() {
                        $super.destroy();
                        $('body').off('click.' + this.id);
                    },

                    renderHeaderCell: function(column, columnIdx) {
                        var header = $super.renderHeaderCell(column, columnIdx);

                        if(column.filterable === undefined || column.filterable) {
                            header.addClass('pg-filterable');
                            // Add the column key to the input field.
                            // If the column has a searchFormula make the field ReadOnly
                            var htmlFilterBox = jQuery.parseHTML(filterBox)[0];
                            htmlFilterBox.children[1].setAttribute('data_column', column.key);
                            if(column.searchFormula != undefined){
                               var filterElement = htmlFilterBox.getElementsByClassName('pg-filter')[0];
                               filterElement.classList.remove('pg-filter');
                               filterElement.classList.add('pg-filter-with-option');
                               filterElement.classList.add('pg-filter');
                            }
                            header.append(htmlFilterBox);
                            if(column.disableFiltering === true){
                               var filterElement = htmlFilterBox.getElementsByClassName('pg-filter')[0];
                               filterElement.classList.remove('pg-filter');
                               var filterElementInput = htmlFilterBox.getElementsByClassName('pg-filter-input')[0];
                               filterElementInput.classList.add('pg-column-disableFiltering');
                               filterElementInput.readOnly = true;
                               filterElementInput.title = 'It is not possible to filter on this column.';
                            }
                            var timer;
                            var currentFilterValue;

                            header.on('input', '.pg-filter-input', function(event) {
                                currentFilterValue = this.value;
                                function filterOnTimeOut() {
                                    grid.filtering.setColumnFilteringAttribute(column.key, { 'value': currentFilterValue });
                                    timer = undefined;
                                }
                                if (timer=== undefined){
                                    timer = setTimeout(filterOnTimeOut, 2000);
                                }
                            });

                            header.on('click', '.pg-filter-input', function(event) {
                                if(column.searchFormula!==null && column.searchFormula!==undefined){
                                   if(currentFilterPane) {
                                      grid.filtering.closeFilterPane();
                                   } else {
                                      grid.filtering.openFilterPane(column, event.clientY, event.clientX);
                                   }

                                }
                            });

                            var filterParams = grid.loadSetting('filterParams');
                            if (filterParams) {
                                if (filterParams[column.key] && filterParams[column.key].value != "") {
                                    var columnParams = filterParams[column.key];
                                    $(header).find('.pg-filter-input')[0].value = columnParams['value'];
                                }
                            }
                        }

                        return header;
                    },

                    filterHeight: function() {
                        return Math.max.apply(undefined, this.target.find('.pg-columnheader .pg-filter-box').map(function(i, e) {
                            return $(e).outerHeight();
                        }));
                    },

                    headerHeight: function() {
                        return $super.headerHeight() + this.filterHeight();
                    },

                    filtering: {
                        // Function to dynamically generate the html for the search box based on the values received from the searchFormula
                        createFilterHtml: function(options, column){
                            var list = document.createElement('ul');
                            list.className = 'pg-menu';
                            list.setAttribute('data_column_key', column.key);

                            var options_str = '';
                            options.forEach( function(option) {
                              option = option.replace(' ','');
                              options_str += '<li data-filter-method="contains" data-filter-type="exactValue" data-filter-value="' + option + '">' + option + '</li>';
                            });

                            list.innerHTML = options_str;
                            return list;
                        },

                        renderFilterPane: function(container, column) {
                            // If the search Formula is defined the html will be generated. In other cases take the default one.
                            if(column.searchFormula!=undefined){
                               // To improve: execute the formula in state of taking the values only
                               var select = this.createFilterHtml(column.searchFormula.substring(1,column.searchFormula.length-1).split(","), column);
                               container.html(select);
                            }
                            else {
                                  container.html(filterPane);
                            }

                            container.on('click', '[data-filter-method],[data-filter-type]', function(event) {
                                var timer;

                                // If the data-filter-method is equal to 'exactValue' an option is selected
                                // In case an option is selected the screen will not close and the selected option will be added to the list
                                var inputFields = $(this).parent().parent().parent().find('.pg-filter-input');
                                if('exactValue' === $(this).attr('data-filter-type')){
                                     var timer;
                                     var selectedValue =$(this).attr('data-filter-value');
                                     var selectedMethod =$(this).attr('data-filter-method');
                                     var selectedType =$(this).attr('data-filter-type');
                                     var alreadySelected=[];
                                     var columnFound=false;
                                     for (var j=0;j<grid.selectedFilterValues.length;j++){
                                        if(grid.selectedFilterValues[j][column.key] != undefined){
                                           columnFound=true;
                                           if (grid.selectedFilterValues[j][column.key]!==""){
                                              alreadySelected = grid.selectedFilterValues[j][column.key].split(",");
                                           }
                                           if(alreadySelected.contains(selectedValue)){
                                              var index = alreadySelected.indexOf(selectedValue);
                                              alreadySelected = alreadySelected.remove(index);
                                              event.target.style.backgroundColor = '#565655';
                                           }else{
                                              alreadySelected.push(selectedValue);
                                              event.target.style.backgroundColor = '#b1abab';
                                           }
                                           grid.selectedFilterValues[j][column.key] = alreadySelected.toString();
                                           break;
                                        }
                                     }
                                     if(columnFound===false){
                                         alreadySelected.push(selectedValue);
                                         var map = new Map();
                                         map[column.key]=alreadySelected.toString();
                                         grid.selectedFilterValues.push(map);
                                     }

                                     // Search for the input Field of the column and assign the new filter parameters to it.
                                     var inputField=[];
                                     for(var l=0;l<inputFields.length;l++){
                                         var attributes = inputFields[l].attributes;
                                         if (attributes !== undefined){
                                            for(var k=0;k<attributes.length;k++){
                                               if(attributes[k].nodeName==='data_column' && attributes[k].nodeValue===column.key){
                                                  inputField.push(inputFields[l]);
                                               }
                                            }
                                         }
                                     }
                                     if(inputField !== undefined){
                                        inputField[0].value = alreadySelected.toString();
                                     }

                                     // To Improve: for performance execute the filtering when the screen is closed.
                                     grid.filtering.setColumnFilteringAttribute(column.key, {
                                          method: selectedMethod,
                                          type: selectedType,
                                          value: alreadySelected.toString() });
                                }
                                else {
                                  grid.filtering.setColumnFilteringAttribute(column.key,
                                    {
                                      method: $(this).attr('data-filter-method'),
                                      type: $(this).attr('data-filter-type')
                                  });
                                  grid.filtering.closeFilterPane();
                                }
                            });
                        },

                        closeFilterPane: function() {
                            currentFilterPane.remove();
                            currentFilterPane = null;
                        },

                        openFilterPane: function(column, offsetTop, offsetLeft) {
                            currentFilterPane = $('<div class=''pg-filter-pane''>');
                            grid.filtering.renderFilterPane(currentFilterPane, column);
                            currentFilterPane.css('top', offsetTop + 'px').css('left', offsetLeft + 'px');

                             //When the filter panel is opening make sure the values are selected
                             //This code should only be executed when the options are available
                             var availableOptions = currentFilterPane[0].getElementsByClassName('pg-menu')[0].getElementsByTagName('li');
                             var alreadySelectedMap = grid.selectedFilterValues.filter(function(map){return map[column.key] != undefined});
                             if(alreadySelectedMap.length>0){
                                  var selectedOptions = alreadySelectedMap[0][column.key].split(",");
                                  if(availableOptions != undefined){
                                      for (var i = 0; i < availableOptions.length; i++) {
                                          var attributes = availableOptions[i].attributes;
                                          for(var j=0; j< attributes.length;j++){
                                              if(selectedOptions.contains(attributes[j].nodeValue)){
                                                  availableOptions[i].style.backgroundColor='#b1abab';
                                                  break;
                                              }
                                          }
                                      }
                                  }
                             }

                             $('body').append(currentFilterPane);
                        },

                        filter: function(settings) {
                            for (var filterOption in settings){
                                if (settings.hasOwnProperty(filterOption) && settings[filterOption]['value'] == ''){
                                    delete settings[filterOption];
                                }
                            }
                            grid.dataSource.applyFilter(settings, settings && this.rowMatches.bind(this, settings));
                            grid.saveSetting('filterParams', settings);
                        },

                        rowMatches: function(settings, row) {
                            for(var x in settings) {
                                if(!this.valueMatches(settings[x], row[x])) {
                                    if(settings[x].type == 'inclusive') {
                                        return 0;
                                    }
                                } else {
                                    if(settings[x].type == 'exclusive') {
                                        return -1;
                                    }
                                }
                            }
                            return 1;
                        },

                        valueMatches: function(columnSetting, value) {
                            if (columnSetting.method === undefined) {
                                return false;
                            }
                            var hasValue = value !== undefined && value !== null && value !== "";
                            switch(columnSetting.method) {
                                case 'contains':
                                    return (!columnSetting.value || hasValue && ((value+'').toLocaleUpperCase()).indexOf(columnSetting.value.toLocaleUpperCase()) > -1);
                                case 'beginsWith':
                                    return (!columnSetting.value || hasValue && value.length >= columnSetting.value.length && value.substring(0, columnSetting.value.length).toLocaleUpperCase() == columnSetting.value.toLocaleUpperCase());
                                case 'endsWith':
                                    return (!columnSetting.value || hasValue && value.length >= columnSetting.value.length && value.substring(value.length - columnSetting.value.length).toLocaleUpperCase() == columnSetting.value.toLocaleUpperCase());
                                default: throw 'Unsupported filter operator ' + columnSetting.type;
                            }
                        },

                        setColumnFilteringAttribute: function(key, attributes) {
                            var ds = grid.dataSource;
                            if(!columnSettings[key]) columnSettings[key] = this.createDefaultFiltering(key);
                            $.extend(columnSettings[key], attributes);

                            if (ds.getInitialPagingSize() == null) {
                                this.filter(columnSettings);
                                return;
                            }

                            var filterOptions = {paging: {initialPagingSize: ds.getInitialPagingSize(), nrOfRowsToSelect: ds.getInitialPagingSize(), startingRow: 0}};
                            columnSettings.filtering = !(attributes.value === undefined || attributes.value === "");
                            $.extend(filterOptions, columnSettings);

                            this.filter(filterOptions);
                        },

                        createDefaultFiltering: function(key) {
                            return { value: '', method: 'contains', type: 'inclusive' };
                        }
                    }
                }
            });
        }
   };

});
