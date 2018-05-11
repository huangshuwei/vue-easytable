import classesMixin from './classes-mixin.js'
import scrollControlMixin from './scroll-control-mixin.js'
import frozenColumnsMixin from './frozen-columns-mixin.js'
import tableResizeMixin from './table-resize-mixin.js'
import sortControlMixin from './sort-control-mixin.js'
import tableEmptyMixin from './table-empty-mixin.js'
import dragWidthMixin from './drag-width-mixin.js'
import cellEditMixin from './cell-edit-mixin.js'
import bodyCellMergeMixin from './body-cell-merge-mixin.js'
import titleCellMergeMixin from './title-cell-merge-mixin.js'
import checkboxSelectionMixin from './checkbox-selection-mixin.js'
import tableFooterMixin from './table-footer-mixin.js'
import scrollBarControlMixin from './scroll-bar-control-mixin.js'
import tableRowMouseEventsMixin from './table-row-mouse-events-mixin'
import tableFiltersMixin from './table-filters-mixin'

import utils from '../../src/utils/utils.js'
import deepClone from '../../src/utils/deepClone.js'

import tableEmpty from './table-empty.vue'
import loading from './loading.vue'
import VCheckboxGroup from '../../v-checkbox-group/index.js'
import VCheckbox from '../../v-checkbox/index.js'
import VDropdown from '../../v-dropdown/index.js'


export default {
    name: 'v-table',
    mixins: [classesMixin, tableResizeMixin, frozenColumnsMixin, scrollControlMixin, sortControlMixin, tableEmptyMixin, dragWidthMixin, cellEditMixin, bodyCellMergeMixin, titleCellMergeMixin, checkboxSelectionMixin, tableFooterMixin, scrollBarControlMixin, tableRowMouseEventsMixin, tableFiltersMixin],
    components: {tableEmpty, loading, VCheckboxGroup, VCheckbox, VDropdown},
    data(){
        return {
            // 本地列表数据
            internalTableData: [],
            // 本地宽度
            internalWidth: 0,
            // 本地高度
            internalHeight: 0,
            // 本地列数据
            internalColumns: [],
            // 本地复杂表头数据
            internalTitleRows: [],
            errorMsg: ' V-Table error: ',
            // 最大宽度（当width:'max'时）
            maxWidth: 5000,
            hasFrozenColumn: false,// 是否拥有固定列（false时最后一列的右边border无边框）
            resizeTimer: null
        }
    },
    props: {
        width: [Number, String],
        minWidth: {
            type: Number,
            default: 50
        },
        height: {
            type: Number,
            require: false
        },
        minHeight: {
            type: Number,
            default: 50
        },
        titleRowHeight: {
            type: Number,
            default: 38
        },
        // 随着浏览器窗口改变，横向自适应
        isHorizontalResize: {
            type: Boolean,
            default: false
        },
        // 随着浏览器窗口改变，垂直自适应
        isVerticalResize: {
            type: Boolean,
            default: false
        },

        // 垂直自适应偏移量
        verticalResizeOffset: {
            type: Number,
            default: 0
        },

        tableBgColor: {
            type: String,
            default: '#fff'
        },

        // 表头背景颜色
        titleBgColor: {
            type: String,
            default: '#fff'
        },

        // 奇数行颜色
        oddBgColor: {
            type: String,
            default: ''
        },
        // 偶数行颜色
        evenBgColor: {
            type: String,
            default: ''
        },
        // 内容行高
        rowHeight: {
            type: Number,
            default: 40
        },
        // 多列排序
        multipleSort: {
            type: Boolean,
            default: true
        },
        // 只在 升序和倒序切换
        sortAlways: {
            type: Boolean,
            default: false
        },
        columns: {
            type: Array,
            require: true
        },

        // 特殊表头
        titleRows: {
            type: Array,
            require: true,
            default: function () {
                return []
            }
        },
        tableData: {
            type: Array,
            require: true,
            default: function () {
                return []
            }
        },
        // 分页序号
        pagingIndex: Number,
        // 没数据时的html
        errorContent: {
            type: String,
            default: '暂无数据'
        },
        // 没数据时内容区域高度
        errorContentHeight: {
            type: Number,
            default: 50
        },
        // 是否正在加载,为false 则会显示错误信息（如果加载时间较长，最好设置为true,数据返回后设置为false）
        isLoading: {
            type: Boolean,
            default: false
        },
        loadingContent: {
            type: String,
            default: '<span><i class="v-icon-spin5 animate-loading-23" style="font-size: 28px;opacity:0.6;"></i></span>'
        },
        // 不设置则没有hover效果
        rowHoverColor: {
            type: String
        },
        rowClickColor: {
            type: String
        },
        showVerticalBorder: {
            type: Boolean,
            default: true
        },
        showHorizontalBorder: {
            type: Boolean,
            default: true
        },
        footer: {
            type: Array,
            default: function () {
                return []
            }
        },
        footerRowHeight: {
            type: Number,
            default: 40
        },
        columnWidthDrag: {
            type: Boolean,
            default: false
        },
        loadingOpacity: {
            type: Number,
            default: 0.6
        },
        // 表体单元格样式回调
        columnCellClassName: Function,
        // footer单元格样式回调
        footerCellClassName: Function,
        // 行单击回调
        rowClick: Function,
        // 行双击回调
        rowDblclick: Function,
        // 表头单元格单击回调
        titleClick: Function,
        // 表头单元格双击回调
        titleDblclick: Function,
        // 鼠标进入行的回调
        rowMouseEnter: Function,
        // 鼠标离开行的回调
        rowMouseLeave: Function,
        // 单元格编辑完成回调
        cellEditDone: Function,
        // 单元格合并
        cellMerge: Function,
        // select all
        selectAll: Function,
        // 单个checkbox change event
        selectChange: Function,
        // checkbox-group change event
        selectGroupChange: Function,
        // filter event
        filterMethod: Function
    },
    computed: {

        // 是否是复杂表头
        isComplexTitle(){

            return (Array.isArray(this.internalTitleRows) && this.internalTitleRows.length > 0);
        },

        // 获取表格高度
        getTableHeight(){

            return this.isTableEmpty ? this.tableEmptyHeight : this.internalHeight;
        },

        // 左侧区域宽度
        leftViewWidth(){
            var result = 0
            if (this.hasFrozenColumn) {
                result = this.frozenCols.reduce((total, curr) => total + curr.width, 0);
            }
            return result
        },
        // 右侧区域宽度
        rightViewWidth(){

            let result = this.internalWidth - this.leftViewWidth;

            return this.hasFrozenColumn ? result - 2 : result;
        },

        // 左侧、右侧区域高度
        bodyViewHeight(){
            var result;
            if (this.internalTitleRows.length > 0) {

                result = this.internalHeight - this.titleRowHeight * (this.internalTitleRows.length + this.getTitleRowspanTotalCount);
            } else {
                result = this.internalHeight - this.titleRowHeight;
            }

            // 1px: 当有滚动条时，使滚动条显示全
            result -= (this.footerTotalHeight + 1);

            return result;
        },

        // 所有列的总宽度
        totalColumnsWidth(){
            return this.internalColumns.reduce(function (total, curr) {
                return curr.width ? (total + curr.width) : total;
            }, 0)
        },

        // 获取未固定列的总宽度
        totalNoFrozenColumnsWidth(){

            return this.noFrozenCols.reduce(function (total, curr) {
                return curr.width ? (total + curr.width) : total;
            }, 0)
        },

        // 获取所有的字段
        getColumnsFields(){
            return this.internalColumns.map((item) => {
                    return item.field;
        })
        },

        // 获取非固定列的字段集合
        getNoFrozenColumnsFields(){
            return this.internalColumns.filter(x => !x.isFrozen).map((item) => {
                return item.field;
        })
        },

        // 获取固定列的字段集合
        getFrozenColumnsFields(){
            return this.internalColumns.filter(x => x.isFrozen).map((item) => {
                return item.field;
        })
        }
    },
    methods: {
        // custom columns component event
        customCompFunc(params){

            this.$emit('on-custom-comp', params);
        },

        // 行颜色
        trBgColor(num){
            if ((this.evenBgColor && this.evenBgColor.length > 0) || (this.oddBgColor && this.oddBgColor.length > 0)) {
                return num % 2 === 0 ? {'background-color': this.evenBgColor} : {'background-color': this.oddBgColor};
            }
        },

        // 设置 column 列的样式
        setColumnCellClassName(rowIndex, field, rowData){

            return this.columnCellClassName && this.columnCellClassName(rowIndex, field, rowData);
        },

        // 获取每个表头列的宽度
        titleColumnWidth(fields){
            var result = 0;
            if (Array.isArray(fields)) {
                var matchItems = this.internalColumns.filter((item, index) => {
                        return fields.some(x => x === item.field);
            })

                result = matchItems.reduce((total, curr) => total + curr.width, 0);
            } else {
                console.error(this.errorMsg + 'the fields attribute must be a array in titleRows')
            }
            return result;
        },

        // 获取每个表头列的高度
        titleColumnHeight(rowspan){
            if (rowspan && rowspan > 0) {
                return this.titleRowHeight * rowspan;
            } else {
                return this.titleRowHeight;
            }
        },

        // 超出的title提示
        overflowTitle(row, rowIndex, col){

            var result = '';
            if (typeof col.formatter === 'function') {
                var val = col.formatter(row, rowIndex, this.pagingIndex, col.field);
                // 如果是html 不处理
                if (utils.isHtml(val)) {
                    result = '';
                } else {
                    result = val;
                }
            } else {
                result = row[col.field];
            }
            return result;
        },

        // 获取所有列的总高度
        getTotalColumnsHeight(){

            var titleTotalHeight = (this.internalTitleRows && this.internalTitleRows.length > 0) ? this.titleRowHeight * this.internalTitleRows.length : this.titleRowHeight;

            titleTotalHeight += this.footerTotalHeight;

            return titleTotalHeight + this.internalTableData.length * this.rowHeight + 1;
        },


        // 初始化width
        initTableWidth(){

            this.internalWidth = this.isHorizontalResize ? this.maxWidth : this.width;

        },

        // 当宽度设置 && 非固定列未设置宽度时（列自适应）初始化列集合
        initColumns(){

            this.internalHeight = this.height;

            this.footerTotalHeight = this.getFooterTotalRowHeight;

            this.internalColumns = Array.isArray(this.columns) ? deepClone(this.columns) : [];

            this.internalTitleRows = Array.isArray(this.titleRows) ? deepClone(this.titleRows) : [];

            this.initColumnsFilters();

            this.initResizeColumns();

            this.hasFrozenColumn = this.internalColumns.some(x => x.isFrozen);

            this.initTableWidth();

            this.setSortColumns();


            var self = this, widthCountCheck = 0;

            if (self.internalWidth && self.internalWidth > 0) {
                self.internalColumns.map(function (item) {
                    if (!(item.width && item.width > 0)) {

                        widthCountCheck++;
                        if (self.isHorizontalResize) {
                            console.error(self.errorMsg + "If you are using the isHorizontalResize property,Please set the value for each column's width");
                        } else {
                            item.width = self.internalWidth - self.totalColumnsWidth;
                        }

                    }
                })
            }

            if (widthCountCheck > 1) {
                console.error(this.errorMsg + 'Only allow one column is not set width');
            }

        },


        // 当没设置宽度和高度时动态计算
        initView(){

            // 当没有设置宽度计算总宽度
            if (!(this.internalWidth && this.internalWidth > 0)) {

                if (this.columns && this.columns.length > 0) {
                    this.internalWidth = this.columns.reduce((total, curr) => total + curr.width, 0);

                }
            }

            var totalColumnsHeight = this.getTotalColumnsHeight();

            // 当没有设置高度时计算总高度 || 设置的高度大于所有列高度之和时
            if (!(this.height && this.height > 0) || this.height > totalColumnsHeight) {

                if (!this.isVerticalResize) {

                    this.internalHeight = totalColumnsHeight;
                }

            } else if (this.height <= totalColumnsHeight) {

                this.internalHeight = this.height;
            }
        },

        initInternalTableData(){

            return Array.isArray(this.tableData) ? deepClone(this.tableData) : [];
        },

        // 对外暴露（隐藏显示切换时）
        resize(){
            // fixed bug in IE9 #17
            this.resizeTimer = setTimeout(x => {

                    this.tableResize();
        })
        }
    },
    created(){

        this.internalTableData = this.initInternalTableData(this.tableData);

        if (Array.isArray(this.columns) && this.columns.length > 0) {

            this.initColumns();
        }

        this.updateCheckboxGroupModel();

        this.initView();
    },
    mounted(){

        this.setScrollbarWidth();

        this.tableEmpty();

        this.tableResize();

        if (Array.isArray(this.tableData) && this.tableData.length > 0) {

            this.scrollControl();
        }

        this.controlScrollBar();
    },
    watch: {

        // 重新跟新列信息
        'columns': {
            handler: function (newVal) {

                this.initColumns();
            },
            deep: true
        },
        // 重新覆盖复杂表头信息
        'titleRows': {
            handler: function (newVal) {

                this.initColumns();
            },
            deep: true
        },

        // deep watch
        'tableData': {

            handler: function (newVal) {

                this.skipRenderCells = [];

                this.internalTableData = this.initInternalTableData(newVal);

                this.updateCheckboxGroupModel();

                this.tableEmpty();

                if (Array.isArray(newVal) && newVal.length > 0) {

                    this.initView();

                    this.scrollControl();
                }

                this.resize();
            },
            deep: true
        },
        'pagingIndex': {

            handler: function () {

                this.clearCurrentRow();

                this.bodyScrollTop();
            }
        }
    },
    beforeDestroy(){

        clearTimeout(this.resizeTimer);
    }
}