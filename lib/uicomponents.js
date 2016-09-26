import ko from "knockout";

// about
import abouttpl from './components/about/about.html!text';
// navbar
import navbartpl from './components/navbar/navbar.html!text';
import NavBarVm from './components/navbar/navbar';
// initUI
import inituitpl from './components/initui/initui.html!text';
import InitUIVm from './components/initui/initui';


class UiComponents {
    constructor() { }

    load() {
        //debugger;

        ko.components.register(
            'navbar',
            {
                viewModel: NavBarVm,
                template: navbartpl
            }
        );

        ko.components.register('initui',
            {
                viewModel: InitUIVm,
                template: inituitpl
            }
        );

        ko.components.register('about', {
            template: abouttpl
        });


        /*
        ko.components.register('contacts-bar', { require: 'app/components/contacts-bar/contacts-bar' });
        ko.components.register('initui', { require: 'app/components/initui/initui' });
        ko.components.register('connect-to-public', { require: 'app/components/connect-to-public/connect-to-public' });

        // ... or for template-only components, you can just point to a .html file directly:
        ko.components.register('about', {
            template: { require: 'text!components/about/about.html' }
        });
        */
    }
}


export default new UiComponents()