import React, {Component} from 'react';
import {View, Text} from 'react-native';
import {connect} from 'react-redux';
import {Card, CardSection, Button, Input, Spinner} from './common';
import {logoutUser} from '../actions';
import NavigationService from '../actions/NavigationService';




class Welcome extends Component{

    logoutButtonPress(){
        this.props.logoutUser();
    }

    navigateButtonPress(screen){
        console.log("here " + screen)
        NavigationService.navigate(screen);
    }

    render(){
        return(
           
                <Card>
                    <Text style={styles.textStyle}>
                        Welcome 
                    </Text>
                    {/* <Text style={styles.textStyle}>
                        {this.state.username}
                    </Text> */}
                    <CardSection>
                        <Button onPress={this.navigateButtonPress.bind(this, "AddFriends")}>  
                            Add Friends
                        </Button>    
                    </CardSection>
                    <CardSection>
                        <Button onPress={this.navigateButtonPress.bind(this, "CreateRoom")}>  
                            Create Game
                        </Button>    
                    </CardSection>
                    <CardSection>
                        <Button onPress={this.navigateButtonPress.bind(this, "JoinRoom")}>  
                            Join Game
                        </Button>    
                    </CardSection>
                    <CardSection>
                        <Button onPress={this.logoutButtonPress.bind(this)}>  
                            Logout
                        </Button>    
                    </CardSection>
                                      
                </Card>

        );
    }
}

const styles={
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    textStyle:{
        textAlign: 'center', 
        fontWeight: 'bold',
        fontSize: 50,
    }
}

const mapStateToProps = ({profile}) => {
    // const {username} = profile;

    // return{username};
};

export default connect(null, {logoutUser})(Welcome);