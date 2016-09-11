define(['jquery', 'knockout', './router', 'appsrvc', 'bootstrap', 'knockout-projections'], function ($, ko, router, appsrvc) {

  // Components can be packaged as AMD modules, such as the following:
    ko.components.register('navbar', { require: 'components/navbar/navbar' });
    ko.components.register('contacts-bar', { require: 'components/contacts-bar/contacts-bar' });
    ko.components.register('initui', { require: 'components/initui/initui' });

    // ... or for template-only components, you can just point to a .html file directly:
    ko.components.register('about', {
        template: { require: 'text!components/about/about.html' }
    });

    //ko.components.register('investments-component', { require: 'components/investments-component/investments-component' });
    //ko.components.register('investment-filter', { require: 'components/investment-filter/investment-filter' });
    //ko.components.register('investment-page', { require: 'components/investment-page/investment-page' });
    //ko.components.register('sector-component', { require: 'components/sector-component/sector-component' });
    //ko.components.register('transactions-component', { require: 'components/transactions-component/transactions-component' });

    // [Scaffolded component registrations will be inserted here. To retain this feature, don't remove this comment.]

    // Start the application
    ko.applyBindings({ route: router.currentRoute, appsrvc: appsrvc });
});
