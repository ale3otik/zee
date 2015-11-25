#include "main_header.h"
using namespace std;
extern map<int,connection_info> connections;

int make_socket()
{

	int socket_id;
	struct protoent *protocol_record=NULL;
	struct sockaddr_in server_address;
	
	bool error_state;
	int TCP_PORT_NUMBER = get_config_int_options("TCP_PORT_NUMBER",error_state); // get from config file
	if(!error_state)
	{
		cout<<"use tcp port number: "<< TCP_PORT_NUMBER<<endl;
	}
	else
	{
		TCP_PORT_NUMBER = STANDART_TCP_PORT_NUMBER;
		cout<<"WARNING: can't find port number in configuration file, use standart: "<<TCP_PORT_NUMBER<<endl;
	}

	protocol_record=getprotobyname("tcp");
	socket_id=socket(PF_INET,SOCK_STREAM,protocol_record->p_proto);
	server_address.sin_family=AF_INET;
	server_address.sin_port=htons(TCP_PORT_NUMBER);
	server_address.sin_addr.s_addr=INADDR_ANY;
	
	if(bind(socket_id,(struct sockaddr *)&server_address,sizeof(struct sockaddr_in)))
	{
		cerr<<"ERROR: can't bind socket " << __LINE__;
		exit(1);
	}
	// succes 
	listen(socket_id,30);
	return socket_id;
}