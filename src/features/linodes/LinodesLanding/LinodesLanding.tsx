// import * as moment from 'moment';
// import { clone, compose, defaultTo, lensPath, map, over, path, pathEq, pathOr } from 'ramda';
import { clone, compose, pathOr } from 'ramda';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { bindActionCreators } from 'redux';


import { RouteComponentProps, withRouter } from 'react-router-dom';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
// import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import Hidden from '@material-ui/core/Hidden';
import { StyleRulesCallback, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import ActionsPanel from 'src/components/ActionsPanel';
import Button from 'src/components/Button';
import ConfirmationDialog from 'src/components/ConfirmationDialog';
import setDocs, { SetDocsProps } from 'src/components/DocsSidebar/setDocs';
import { DocumentTitleSegment } from 'src/components/DocumentTitle';
import ErrorState from 'src/components/ErrorState';
import Grid from 'src/components/Grid';
import PaginationFooter from 'src/components/PaginationFooter';
import PromiseLoader, { PromiseLoaderResponse } from 'src/components/PromiseLoader/PromiseLoader';
import { withTypes } from 'src/context/types';
// import { events$ } from 'src/events';
import LinodeConfigSelectionDrawer, { LinodeConfigSelectionDrawerCallback } from 'src/features/LinodeConfigSelectionDrawer';
// import { newLinodeEvents } from 'src/features/linodes/events';
// import notifications$ from 'src/notifications';
import { getImages } from 'src/services/images';
import { getLinode, getLinodes } from 'src/services/linodes';
import scrollToTop from 'src/utilities/scrollToTop';
import { views } from 'src/utilities/storage';

import LinodesGridView from './LinodesGridView';
import LinodesListView from './LinodesListView';
import ListLinodesEmptyState from './ListLinodesEmptyState';
// import { powerOffLinode, rebootLinode } from './powerActions';
import ToggleBox from './ToggleBox';

import { removeEvent } from 'src/store/reducers/events';

type ClassNames = 'root' | 'title';

const styles: StyleRulesCallback<ClassNames> = (theme: Theme) => ({
  root: {},
  title: {
    marginbottom: theme.spacing.unit * 2,
  },
});

interface PreloadedProps {
  linodes: PromiseLoaderResponse<Linode.ResourcePage<Linode.EnhancedLinode>>;
  images: PromiseLoaderResponse<Linode.ResourcePage<Linode.Image>>;
}

interface ConnectedProps {
  events: Partial<Linode.Event>[];
}

interface ConfigDrawerState {
  open: boolean;
  configs: Linode.Config[];
  error?: string;
  selected?: number;
  action?: LinodeConfigSelectionDrawerCallback;
}

interface State {
  linodes: Linode.EnhancedLinode[];
  linodesToUpdate: any;
  notifications?: Linode.Notification[];
  page: number;
  pages: number;
  results: number;
  pageSize: number;
  configDrawer: ConfigDrawerState;
  powerAlertOpen: boolean;
  bootOption: Linode.BootAction;
  selectedLinodeId: number | null;
  selectedLinodeLabel: string;
}

const preloaded = PromiseLoader<{}>({
  linodes: () => getLinodes({ page_size: 25 }),

  images: () => getImages(),
});

interface TypesContextProps {
  typesRequest: () => void;
  typesLoading: boolean;
  typesLastUpdated: number;
}

type CombinedProps = TypesContextProps
  & PreloadedProps
  & RouteComponentProps<{}>
  & WithStyles<ClassNames>
  & SetDocsProps
  & ConnectedProps;

// const L = {
//   response: {
//     data: lensPath(['response', 'data']),
//   }
// };

const isRelevantEvent = (status: string) => {
  if (status === 'linode_boot') {
    return true;
  }
  return false;
} 

export class ListLinodes extends React.Component<CombinedProps, State> {
  eventsSub: Subscription;
  notificationSub: Subscription;
  mounted: boolean = false;

  constructor(props: CombinedProps){
    super(props);

    const linodesToUpdate = props.events.filter(event => {
      return isRelevantEvent(event.action!);
    });

    this.state = {
      linodes: pathOr([], ['response', 'data'], this.props.linodes),
      linodesToUpdate,
      page: pathOr(-1, ['response', 'page'], this.props.linodes),
      pages: pathOr(-1, ['response', 'pages'], this.props.linodes),
      results: pathOr(0, ['response', 'results'], this.props.linodes),
      configDrawer: {
        open: false,
        configs: [],
        error: undefined,
        selected: undefined,
        action: (id: number) => null,
      },
      pageSize: 25,
      powerAlertOpen: false,
      bootOption: null,
      selectedLinodeId: null,
      selectedLinodeLabel: '',
    }
  }

  static docs = [
    {
      title: 'Getting Started with Linode',
      src: 'https://linode.com/docs/getting-started/',
      body: `This guide will help you set up your first Linode.`,
    },
    {
      title: 'How to Secure your Server',
      src: 'https://linode.com/docs/security/securing-your-server/',
      body: `This guide covers basic best practices for securing a production server,
      including setting up user accounts, configuring a firewall, securing SSH,
      and disabling unused network services.`,
    },

  ];

  pollLinodes: any = null; 

  componentDidUpdate() {
    if(!this.state.linodesToUpdate.length && this.pollLinodes !== null) {
      console.log('polling stopped');
      clearInterval(this.pollLinodes);
    }
  }

  componentDidMount() {
    this.mounted = true;
    // const mountTime = moment().subtract(5, 'seconds');

    const { typesLastUpdated, typesLoading, typesRequest } = this.props;

    const { linodesToUpdate } = this.state;

    if (typesLastUpdated === 0 && !typesLoading) {
      typesRequest();
    }

    /*
    * we only want to update Linodes if we have a Linode that's
    * in the process of booting
    */

    /*
    * Now that we have our linodes that we know need to be updated,
    * we need to run getLinode for that linode
    */
    const getEachLinode = () => {
      if (!linodesToUpdate.length && this.pollLinodes !== null) {
        console.log('polling stopped');
        clearInterval(this.pollLinodes);
      }

      return Promise.all(linodesToUpdate.map((linodeToUpdate: any) => {
        return new Promise(() => {
          return getLinode(linodeToUpdate.entity!.id)
            .then((response: any) => {
              const linodesToUpdateClone = clone(this.state.linodesToUpdate);
              const newLinodesToUpdate =
                (response.data.status === 'running' || response.data.status === 'offline')
                  ? linodesToUpdateClone.filter((linode: Linode.Linode) => {
                      // linode.id might be null so this needs to be fixed
                      return linode.id !== response.data.id;
                    })
                  : linodesToUpdateClone;

              console.log('list of Linodes that need updating');
              console.log(newLinodesToUpdate);
              
              this.setState({
                linodes: [
                  ...this.state.linodes.filter(linode => linode.id !== response.data.id),
                  ...response.data,
                ],
                linodesToUpdate: newLinodesToUpdate,
              })
              return response;
            })
            .catch(e => e)
        })
      }))
        // here we will determine if the Linode is finished being
        // provisioned and clear the event from Redux state
        .then((response: any) => response)
        // if there's an error, keep polling
        .catch(e => e)
    }

    if (!!linodesToUpdate.length) {
      console.log('polling started');
      this.pollLinodes = setInterval(
        () => getEachLinode(),
        4000
      )
    }


    // this.eventsSub = events$
    //   .filter(newLinodeEvents(mountTime))
    //   .filter(e => !e._initial)
    //   .subscribe((linodeEvent) => {
    //     const linodeId = path<number>(['entity', 'id'], linodeEvent);
    //     if (!linodeId) { return; }

    //     getLinode(linodeId)
    //       .then(response => response.data)
    //       .then((linode) => {
    //         if (!this.mounted) { return; }

    //         return this.setState((prevState) => {
    //           const targetIndex = prevState.linodes.findIndex(
    //             _linode => _linode.id === (linodeEvent.entity as Linode.Entity).id);
    //           const updatedLinodes = clone(prevState.linodes);
    //           updatedLinodes[targetIndex] = linode;
    //           updatedLinodes[targetIndex].recentEvent = linodeEvent;
    //           return { linodes: updatedLinodes };
    //         });
    //       });
    //   });

    // this.notificationSub = Observable
    //   .combineLatest(
    //     notifications$
    //       .map(notifications => notifications.filter(pathEq(['entity', 'type'], 'linode'))),
    //     Observable.of(this.props.linodes),
    // )
    //   .map(([notifications, linodes]) => over(
    //     L.response.data,
    //     compose(
    //       map(addNotificationToLinode(notifications)),
    //       defaultTo([]),
    //     ),
    //     linodes,
    //   ))
    //   .subscribe((response) => {
    //     if (!this.mounted) { return; }

    //     return this.setState({ linodes: response.response.data });
    //   });
  }

  componentWillUnmount() {
    this.mounted = false;
    if (this.pollLinodes !== null) {
      clearInterval(this.pollLinodes);
    }
    // this.eventsSub.unsubscribe();
    // this.notificationSub.unsubscribe();
  }

  openConfigDrawer = (configs: Linode.Config[], action: LinodeConfigSelectionDrawerCallback) => {
    this.setState({
      configDrawer: {
        open: true,
        configs,
        selected: configs[0].id,
        action,
      },
    });
  }

  closeConfigDrawer = () => {
    this.setState({
      configDrawer: {
        open: false,
        configs: [],
        error: undefined,
        selected: undefined,
        action: (id: number) => null,
      },
    });
  }

  changeViewStyle = (style: 'grid' | 'list') => {
    const { history } = this.props;
    history.push(`#${style}`);
    if (style === 'grid') {
      views.linode.set('grid');
    } else {
      views.linode.set('list');
    }
  }

  getLinodes = (page = 1, pageSize = 25) => {
    const lastPage = Math.ceil(this.state.results / pageSize);
    getLinodes({
      page: Math.min(lastPage, page),
      page_size: pageSize,
    })
      .then((response) => {
        if (!this.mounted) { return; }

        this.setState(prevResults => ({
          ...prevResults,
          linodes: pathOr([], ['data'], response),
          page: pathOr(0, ['page'], response),
          pageSize,
          pages: pathOr(0, ['pages'], response),
          results: pathOr(0, ['results'], response),
        }));
      });
  }

  handlePageSelection = (page: number) => {
    scrollToTop();
    this.getLinodes(Math.min(page), this.state.pageSize);
  }

  handlePageSizeChange = (pageSize: number) => {
    this.getLinodes(this.state.page, pageSize);
  }

  selectConfig = (id: number) => {
    this.setState(prevState => ({
      configDrawer: {
        ...prevState.configDrawer,
        selected: id,
      },
    }));
  }

  submitConfigChoice = () => {
    const { action, selected } = this.state.configDrawer;
    if (selected && action) {
      action(selected);
      this.closeConfigDrawer();
    }
  }

  toggleDialog = (bootOption: Linode.BootAction,
    selectedLinodeId: number, selectedLinodeLabel: string) => {
    this.setState({
      powerAlertOpen: !this.state.powerAlertOpen,
      selectedLinodeId,
      selectedLinodeLabel,
      bootOption,
    });
  }

  // rebootOrPowerLinode = () => {
  //   const { bootOption, selectedLinodeId, selectedLinodeLabel } = this.state;
  //   if (bootOption === 'reboot') {
  //     rebootLinode(this.openConfigDrawer, selectedLinodeId!, selectedLinodeLabel);
  //   } else {
  //     powerOffLinode(selectedLinodeId!, selectedLinodeLabel);
  //   }
  //   this.setState({ powerAlertOpen: false });
  // }

  renderListView = (
    linodes: Linode.Linode[],
    images: Linode.Image[],
  ) => {
    return (
      <LinodesListView
        linodes={linodes}
        images={images}
        openConfigDrawer={this.openConfigDrawer}
        toggleConfirmation={this.toggleDialog}
      />
    );
  }

  renderGridView = (
    linodes: Linode.Linode[],
    images: Linode.Image[],
  ) => {
    return (
      <LinodesGridView
        linodes={linodes}
        images={images}
        openConfigDrawer={this.openConfigDrawer}
        toggleConfirmation={this.toggleDialog}
      />
    );
  }

  render() {
    const { location: { hash } } = this.props;
    const { linodes, configDrawer, bootOption, powerAlertOpen, results } = this.state;
    const images = pathOr([], ['response', 'data'], this.props.images);

    if (linodes.length === 0) {
      return (
        <React.Fragment>
          <DocumentTitleSegment segment="Linodes" />
          <ListLinodesEmptyState />
        </React.Fragment>
      );
    }

    if (this.props.linodes.error) {
      return (
        <React.Fragment>
          <DocumentTitleSegment segment="Linodes" />
          <ErrorState errorText="Error loading data" />
        </React.Fragment>
      );
    }

    if (this.props.images.error) {
      return (
        <React.Fragment>
          <DocumentTitleSegment segment="Linodes" />
          <ErrorState errorText="Error loading data" />
        </React.Fragment>
      );
    }

    const displayGrid: 'grid' | 'list' = getDisplayFormat({ hash, length: results });

    return (
      <Grid container>
        <DocumentTitleSegment segment="Linodes" />
        <Grid item xs={12}>
          <Typography
            role="header"
            variant="headline"
            className={this.props.classes.title}
            data-qa-title
          >
            Linodes
          </Typography>
          <Hidden smDown>
            <ToggleBox
              handleClick={this.changeViewStyle}
              status={displayGrid}
            />
          </Hidden>
        </Grid>
        <Grid item xs={12}>
          <Hidden mdUp>
            {this.renderGridView(linodes, images)}
          </Hidden>
          <Hidden smDown>
            {displayGrid === 'grid'
              ? this.renderGridView(linodes, images)
              : this.renderListView(linodes, images)
            }
          </Hidden>
        </Grid>
        <Grid item xs={12}>
          {
            this.state.results > 25 &&
            <PaginationFooter
              count={this.state.results}
              handlePageChange={this.handlePageSelection}
              handleSizeChange={this.handlePageSizeChange}
              pageSize={this.state.pageSize}
              page={this.state.page}
            />
          }
          <LinodeConfigSelectionDrawer
            onClose={this.closeConfigDrawer}
            onSubmit={this.submitConfigChoice}
            onChange={this.selectConfig}
            open={configDrawer.open}
            configs={configDrawer.configs}
            selected={String(configDrawer.selected)}
            error={configDrawer.error}
          />
        </Grid>
        <ConfirmationDialog
          title={(bootOption === 'reboot') ? 'Confirm Reboot' : 'Powering Off'}
          actions={this.renderConfirmationActions}
          open={powerAlertOpen}
        >
          <Typography>
            {bootOption === 'reboot'
              ? 'Are you sure you want to reboot your Linode'
              : 'Are you sure you want to power down your Linode'
            }
          </Typography>
        </ConfirmationDialog>
      </Grid>
    );
  }

  renderConfirmationActions = () => {
    const { bootOption } = this.state;
    return (
      <ActionsPanel style={{ padding: 0 }}>
        <Button
          type="cancel"
          onClick={this.closePowerAlert}
          data-qa-cancel-cancel
        >
          Cancel
        </Button>
        <Button
          type="primary"
          // onClick={this.rebootOrPowerLinode}
          data-qa-confirm-cancel
        >
          {bootOption === 'reboot' ? 'Reboot' : 'Power Off'}
        </Button>
      </ActionsPanel>
    );
  };

  closePowerAlert = () => this.setState({ powerAlertOpen: false });
}


// const getNotificationMessageByEntityId = (id: number, notifications: Linode.Notification[]): undefined | string => {
//   const found = notifications.find((n) => n.entity !== null && n.entity.id === id);
//   return found ? found.message : undefined;
// }

// const addNotificationToLinode = (notifications: Linode.Notification[]) => (linode: Linode.Linode) => ({
//   ...linode,
//   notification: getNotificationMessageByEntityId(linode.id, notifications)
// });

const getDisplayFormat = ({ hash, length }: { hash?: string, length: number }): 'grid' | 'list' => {

  if (hash) {
    return hash === '#grid' ? 'grid' : 'list';
  }

  /*
  * If local stroage exists, set the view based on that
  */
  if (views.linode.get() !== null) {
    return views.linode.get();
  }

  return (length >= 3) ? 'list' : 'grid';
};

export const styled = withStyles(styles, { withTheme: true });

const typesContext = withTypes(({
  lastUpdated: typesLastUpdated,
  loading: typesLoading,
  request: typesRequest,
}) => ({
  typesRequest,
  typesLoading,
  typesLastUpdated,
}));

const mapStateToProps = (state: Linode.AppState) => ({
  events: state.events,
});

const mapDispatchToProps = (dispatch: Dispatch<any>) => bindActionCreators(
  { removeEvent },
  dispatch
);

const connected = connect(mapStateToProps, mapDispatchToProps);

export const enhanced = compose(
  withRouter,
  connected,
  typesContext,
  styled,
  preloaded,
  setDocs(ListLinodes.docs),
);

export default enhanced(ListLinodes) as typeof ListLinodes;
