/*

This file is part of Streembit application. 
Streembit is an open source communication application. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------

*/


(function () {
    define(['./help.html!text'], function ( template) {
        function HelpViewModel(params) {
            var vm = {

                init: function () {

                    $.fn.extend({
                        treed: function (o) {

                            var openedClass = 'glyphicon-minus-sign';
                            var closedClass = 'glyphicon-plus-sign';

                            if (typeof o != 'undefined') {
                                if (typeof o.openedClass != 'undefined') {
                                    openedClass = o.openedClass;
                                }
                                if (typeof o.closedClass != 'undefined') {
                                    closedClass = o.closedClass;
                                }
                            };

                            //initialize each of the top levels
                            var tree = $(this);
                            tree.addClass("tree");
                            tree.find('li').has("ul").each(function () {
                                var branch = $(this); //li with children ul
                                branch.prepend("<i class='indicator glyphicon " + closedClass + "'></i>");
                                branch.addClass('branch');
                                branch.on('click', function (e) {
                                    if (this == e.target) {
                                        var icon = $(this).children('i:first');
                                        icon.toggleClass(openedClass + " " + closedClass);
                                        $(this).children().children().toggle();
                                    }
                                })
                                branch.children().children().toggle();
                            });
                            //fire event from the dynamically added icon
                            tree.find('.branch .indicator').each(function () {
                                $(this).on('click', function () {
                                    $(this).closest('li').click();
                                });
                            });
                            //fire event to open branch if the li contains an anchor instead of text
                            tree.find('.branch>a').each(function () {
                                $(this).on('click', function (e) {
                                    $(this).closest('li').click();
                                    e.preventDefault();
                                });
                            });
                            //fire event to open branch if the li contains a button instead of text
                            tree.find('.branch>button').each(function () {
                                $(this).on('click', function (e) {
                                    $(this).closest('li').click();
                                    e.preventDefault();
                                });
                            });
                        }
                    });

                    $(document).ready(function () {
                        //$('#helptree').treed();

                        $('.tree li').on("click", function () {
                            var datalink = $(this).attr("data-link");
                            if (datalink) {
                                $(".help-content").empty();
                                var html = $('#' + datalink).html();
                                $(".help-content").append(html);
                            }
                        });

                        $('.tree > ul').attr('role', 'tree').find('ul').attr('role', 'group');
                        $('.tree').find('li:has(ul)').addClass('parent_li').attr('role', 'treeitem').find(' > span').attr('title', 'Collapse this branch').on('click', function (e) {
                            var children = $(this).parent('li.parent_li').find(' > ul > li');
                            if (children.is(':visible')) {
                                children.hide('fast');
                                $(this).attr('title', 'Expand this branch').find(' > i').removeClass().addClass('fa fa-lg fa-plus-circle');
                            } else {
                                children.show('fast');
                                $(this).attr('title', 'Collapse this branch').find(' > i').removeClass().addClass('fa fa-lg fa-minus-circle');
                            }
                            e.stopPropagation();
                        });			
                    });
                }
            };     

            //  there is no other easy way to load the tree handler jquery code upon component loading
            //  so handle this with a timer
            setTimeout(function () {
                vm.init();
            },
            250);            

            return vm;
        }

        return {
            viewModel: HelpViewModel,
            template: template
        };
    });
}());
