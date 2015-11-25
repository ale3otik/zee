
#ifndef _MAIN_HEADER_H_
#define _MAIN_HEADER_H_

//includes
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <netdb.h>
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <memory.h>
#include <fcntl.h>
#include <fstream>
#include <sstream>
#include <iostream>
#include <string>
#include <map>

//constants
#define CONFIG_FILENAME "servconf.cfg"
#define STANDART_TCP_PORT_NUMBER 8900
#define STANDART_NUM_CONNECTIONS 150
#define STANDART_START_PAGE "index.html"
#define IP_LENGTH 17
//structs

enum http_query_type
{
	GET,
	POST,
	ERROR
};

struct connection_info
{
	size_t id;
	int fd;
	struct _ip
	{
		char str[IP_LENGTH];
		long long bytes;
	} ip;
};
typedef struct connection_info connection_info ;
//functions
	//functions.cpp
		int get_config_int_options(const std::string & options_name, bool & error_state);
		int get_config_int_options(const char * options_name, bool & error_state);
		void process_query(std::stringstream & answer_full, const char * buf, int length); 
	//socket_work.cpp
		int make_socket();
#endif
