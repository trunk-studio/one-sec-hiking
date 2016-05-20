import React, {
  Component,
  Dimensions,
  View,
  Linking,
  TouchableOpacity,
  StatusBar,
  Text,
  Alert,
  Platform,
} from 'react-native';
import CoverCard from '../components/CoverCard';
import NewsBoard from '../components/NewsBoard';
import Filter from '../components/Filter/FilterContainer';
import activityData from '../src/activity.json';
import { connect } from 'react-redux';
import { Actions } from 'react-native-router-flux';
import { requestNews, requestFilterArea, requestFilterType } from '../actions/SearchActions';
import { requestToday } from '../actions/DateActions';
import { requestWeather } from '../actions/WeatherActions';
import Icon from 'react-native-vector-icons/FontAwesome';
import ParallaxView from 'react-native-parallax-view';
import ReactNativeAutoUpdater from 'react-native-auto-updater';
import { requestSetLocation } from '../actions/GeoActions';

// const coverImg = require('../images/dashboard.png');
const coverImg = {uri: 'http://i.imgur.com/npjaJgX.png'};
const StyleSheet = require('../utils/F8StyleSheet');
const windowSize = Dimensions.get('window');
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    marginBottom: 50,
    ios: {
      // marginTop: 21,
    },
  },
  searchIcon: {
    color: '#fff',
    paddingRight: 10,
    fontSize: 16,
  },
  icon: {
    lineHeight: 15,
    fontSize: 20,
  },
  searchContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  searchBtn: {
    margin: 10,
    padding: 5,
    borderRadius: 3,
    backgroundColor: 'rgb(79, 164, 89)',
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  searchText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: 'bold',
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowColor: 'black',
    shadowOpacity: 1.0,
  },
  bar: {
    ios: {
      position: 'absolute',
      width: windowSize.width * 7,
      height: windowSize.width * 7,
      top: -25,
      left: -windowSize.width * 3,
      backgroundColor: '#fff',
      borderRadius: windowSize.width * 3.5,
      borderColor: 'rgb(79, 164, 89)',
      borderWidth: 5,
    },
    android: {
      width: windowSize.width,
      height: 5,
      backgroundColor: 'rgb(79, 164, 89)',
      marginBottom: 10,
    },
  },
  versionBlock: {
    position: 'absolute',
    bottom: 15,
    right: 5,
    padding: 2,
  },
  imgSrcText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#555',
    fontStyle: 'italic',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowColor: 'black',
    shadowOpacity: 1.0,
  },
});

export default class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      areaId: 0,
      typeId: 0,
    };
  }
  componentWillMount() {
    // this.props.requestNews();
    // this.props.requestToday();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.props.requestSetLocation(position);
          this.setState({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          // navigator.geolocation.stopObserving();
        },
        (error) => {
          navigator.geolocation.stopObserving();
          // Alert.alert(error.toString());
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 },
      );
    }
    let url;
    if (Platform.OS === 'ios') {
      url = 'https://s3-ap-northeast-1.amazonaws.com/s3.trunksys.com/hiking/qa/packager/metadata.json';
    } else {
      url = 'https://s3-ap-northeast-1.amazonaws.com/s3.trunksys.com/hiking/qa/packager/metadata.android.json';
    }
    fetch(url)
    .then((response) => response.text())
    .then((responseText) => {
      const onlineMetadata = JSON.parse(responseText);
      const onlineVersion = onlineMetadata.version.split('.');
      const nowVersion = ReactNativeAutoUpdater.jsCodeVersion().split('.');
      if (onlineVersion[0] !== nowVersion[0]) {
        Alert.alert('版本過舊', '請至 App Store 更新');
      } else if (onlineVersion[1] !== nowVersion[1] || onlineVersion[2] !== nowVersion[2]) {
        Alert.alert('有新版本喔', '重新開啟 App 更新');
      }

    })
    .catch((error) => {
      console.warn(error);
    });
  }
  componentWillReceiveProps(nextProps) {
    const { countryName, locationName } = nextProps;
    if (locationName !== undefined && locationName !== this.props.locationName) {
      this.props.requestWeather({ name: locationName, country: countryName });
    }
  }
  areaOnChange = (id) => {
    // this.props.requestFilterArea(id);
    this.setState({
      areaId: id,
    });
  };
  typeOnChange = (id) => {
    // this.props.requestFilterType(id);
    this.setState({
      typeId: id,
    });
  };
  onSearchHandle = () => {
    this.props.requestFilterArea(this.state.areaId);
    this.props.requestFilterType(this.state.typeId);
    Actions.tabList();
  };
  render() {
    function onListItemPress(detail) {
      // Actions.newsDetail({
      //   newsTitle: detail.title,
      //   newsContent: detail.content,
      // });
      const url = activityData.list[detail.index].url;
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        }
      });
    }
    const { listData, month, date, weekday, temp, desc, iconId } = this.props;
    let activityListData = [];
    for (const item of activityData.list) {
      activityListData.push({
        title: item.title,
        content: item.description,
      });
    }
    const area = [
      { title: '全部區域' },
      { title: '北部' },
      { title: '中部' },
      { title: '南部' },
      { title: '東部' },
    ];
    const type = [
      { title: '全部類型' },
      { title: '郊　山' },
      { title: '中級山', width: 65 },
      { title: '百　岳' },
    ];
    return (
      <ParallaxView
        backgroundSource={coverImg}
        windowHeight={300}
        header={(
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
                台灣步道 1 指通
            </Text>
            <View style={styles.versionBlock}>
              <Text style={styles.imgSrcText}>
                v {ReactNativeAutoUpdater.jsCodeVersion()}
              </Text>
            </View>
          </View>
        )}
      >
        <StatusBar barStyle="light-content" />
        <View style={{ backgroundColor: '#fff', marginBottom: 50 }}>
          <View style={styles.bar} />
          <Filter
            title={'類型'}
            dataList={type}
            active={this.state.typeId}
            onChange={this.typeOnChange}
            activeColor={'#37A22E'}
          />
          <Filter
            title={'區域'}
            dataList={area}
            active={this.state.areaId}
            onChange={this.areaOnChange}
            activeColor={'#338CAB'}
          />
          <View style={styles.searchContainer}>
            <TouchableOpacity style={styles.searchBtn} onPress={this.onSearchHandle}>
              <Icon name={'search'} style={ styles.searchIcon } />
              <Text style={styles.searchText}>搜尋台灣步道</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 0.5, backgroundColor: 'rgb(79, 164, 89)' }} />
          <NewsBoard boardTitle={'近期活動'} listData={activityListData}
            itemCount={30} onItemPress={onListItemPress}
          />
        <View style={{ height: 0.5, backgroundColor: 'rgb(79, 164, 89)' }} />
        </View>
      </ParallaxView>
    );
  }
}

Dashboard.propTypes = {
  onListItemPress: React.PropTypes.func,
  requestNews: React.PropTypes.func,
  requestSearchPost: React.PropTypes.func,
  requestToday: React.PropTypes.func,
  requestSetLocation: React.PropTypes.func,
  requestWeather: React.PropTypes.func,
  uri: React.PropTypes.string,
  month: React.PropTypes.number,
  date: React.PropTypes.number,
  weekday: React.PropTypes.string,
  desc: React.PropTypes.string,
  iconId: React.PropTypes.string,
  listData: React.PropTypes.array,
  temp: React.PropTypes.number,
  countryName: React.PropTypes.string,
  locationName: React.PropTypes.string,
  requestFilterType: React.PropTypes.func,
  requestFilterArea: React.PropTypes.func,
  typeIndex: React.PropTypes.number,
  areaIndex: React.PropTypes.number,
};

Dashboard.defaultProps = {
  onListItemPress: null,
  requestNews: null,
  requestSearchPost: null,
  requestToday: null,
  requestSetLocation: null,
  requestWeather: null,
  month: 1,
  date: 1,
  requestFilterType: null,
  requestFilterArea: null,
};

function _injectPropsFromStore(state) {
  return {
    listData: state.search.newsList,
    month: state.getToday.month,
    date: state.getToday.date,
    weekday: state.getToday.weekday,
    desc: state.weather.desc,
    iconId: state.weather.iconId,
    countryName: state.geo.countryName,
    locationName: state.geo.locationName,
    temp: state.weather.temp,
    typeIndex: state.search.typeIndex,
    areaIndex: state.search.areaIndex,
  };
}

const _injectPropsFormActions = {
  requestNews,
  requestToday,
  requestSetLocation,
  requestWeather,
  requestFilterArea,
  requestFilterType,
};

export default connect(_injectPropsFromStore, _injectPropsFormActions)(Dashboard);
