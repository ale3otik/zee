#include "main_header.h"
#include <ctime>
#include <unistd.h>
#include <sys/types.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <signal.h>
#include <sys/ioctl.h>
#include <termios.h>
#include <fcntl.h>
#include <sys/types.h>
#include <pwd.h>
#include <uuid/uuid.h>

using namespace std;
extern map<int,connection_info> connections;
/***
**
*****************CONFIGURATION READ FUNCTIONS**********************
**
***/
void add_new_ip_visitor(const connection_info & info) 
{
	FILE * fp;
	fp = fopen(SAVE_INFO_FILENAME,"a");
	if(fp == NULL) {
		cout << "A" <<endl;
	 	return;
	}
	string out = info.ip.str;

	time_t seconds = time(NULL);
	tm * timeinfo = localtime(&seconds);
	out  += " << " + string(asctime(timeinfo));

	fwrite(out.c_str(),sizeof(char),out.size(),fp);
	fclose(fp);
}

int get_config_int_options(const char * options_name, bool & error_state)
{
	const string options_name_string(options_name);
	return get_config_int_options(options_name_string, error_state);
}

int get_config_int_options(const string & options_name, bool & error_state)
{
	int option = 0;
	ifstream config_file(CONFIG_FILENAME);
	error_state = true;
	if(!config_file.is_open()) //can't open file
	{	
		return 0;
	}
	
	while(!config_file.eof())
	{
		char tmp_cstr[512] = "";
		config_file.getline(tmp_cstr,512);
		string tmp(tmp_cstr);
		size_t position = tmp.find_last_of(options_name);
		if(position == -1)
		{
			continue;
		}
		else
		{
			int readed_positions = 0;
			int i = position + 1;
			while(i < tmp.length() && tmp[i] == ' ') ++i;
			if(i == tmp.length()) continue;
			while(i < tmp.length() && tmp[i]>='0' && tmp[i]<='9')
			{
				option *= 10;
				option += tmp[i] - '0';
				++readed_positions;
				++i;
			}

			if(readed_positions > 0)
			{
				error_state = false;
				return option;
			}
		}
	}
	return 0;
}

/**
*************QUERY OPTIONS DETECTED**************
**/

bool path_warning_detected(const string & path)
{
	if(path.length() == 0) return false;
	if(path.find("cgi_scripts") != string::npos) return true;
	//if(path[0] == '/') return true;
	for(int i = 0; i < path.length()-1;++i)
	{
		if(path[i] == '.' && path[i+1] == '.') return true;
	}
	return false;
}

http_query_type get_http_query(string & ask_filename, int & result_position, const char * data)
{
	http_query_type query_type = ERROR;
	string data_str(data);
	int position = 0;
	string first_word = "";
	for(;position < data_str.length() && position < 50 && data_str[position]!=' ' && data_str[position]!='\n'; ++position)
	{
		first_word+=data_str[position];
	} 
	
	for(position+= 1;position < data_str.length() && data_str[position]!=' ' && data_str[position]!='\n'; ++position)
	{
		ask_filename += data_str[position];
	}

	result_position = position;
	
    if(first_word == "GET")
	{
		if(path_warning_detected(ask_filename)) return ERROR;
		query_type = GET;
	}
	else if(first_word == "POST")
	{
		//обработка post
		query_type = POST;
	}
	else
	{
		query_type = ERROR;
	}

	return query_type;
}


/***
**
************FILE SYSTEM***************************
**
***/
void streams_copy(string & to,int fd_from)
{
	char tmp[2048];
	int length = 0;
	to = "";
	do
	{
		length = read(fd_from,tmp,2047);
		tmp[length] = 0;
		to += tmp;
	}while(length > 0);
}

void get_from_file(int fd, stringstream & answer) {
	int sz;
	char buf[512];
	while(true) {
		sz = read(fd, buf, 511);
		if(sz <= 0) break;
		buf[sz] = 0;
		answer << buf;
	} 
}

/*******************POST SCRIPT DETECTED*******/
bool process_script(string & fname, int rpos, const char * buf, stringstream & answer_body) {
	string ans_body_str;
	string data(buf);
	data.erase(0,rpos);
	int fildes_to[2];
	int fildes_from[2];
	pipe(fildes_to);
	pipe(fildes_from);
	if(fildes_to[0] < 0 || fildes_to[1] < 0) return false;
	if(fildes_from[0] < 0 || fildes_from[1] < 0) return false;
	string result_name = "cgi_scripts/" + fname;
	printf("%s\n",result_name.c_str());
	if(!fork()) {
		close(fildes_from[0]);
		close(fildes_to[1]);
		dup2(fildes_to[0],0);
		dup2(fildes_from[1],1);

		// only java programms allowed
		if(fname.find(".jar") != string::npos){
			execlp("java","java","-jar",result_name.c_str(),0);
		}

		printf("#$#!^errorexeclp#");
		close(0);
		close(1);
		exit(0);
	}

	close(fildes_from[1]);
	close(fildes_to[0]);
	
	write(fildes_to[1],data.c_str(),data.length());
	get_from_file(fildes_from[0],answer_body);

	close(fildes_from[0]);
	close(fildes_to[1]);

	if(answer_body.str().substr(0,18) == "#$#!^#errorexeclp#") return false;
	return true;
}
/****************GENERAL HANDLER***************/
void process_query(stringstream & answer_full,const char * buf,const int result)
{
	bool is_succes_query = false;
	stringstream answer_head;
	stringstream answer_body;
	string asking_file_name = "";
	int result_position;
	http_query_type query_type = get_http_query(asking_file_name,result_position,buf);
	
	if(query_type == GET)
	{
			int fd;
			if(asking_file_name == "/")
			{
				fd = open(STANDART_START_PAGE,O_RDONLY);
			}
			else 
			{
				if(asking_file_name.length() > 0 && asking_file_name[0] == '/') asking_file_name.erase(0,1);
				fd = open(asking_file_name.c_str(),O_RDONLY);
			}
			if(fd >= 0)
			{
				string answer_body_string = "";
				is_succes_query = true;
				streams_copy(answer_body_string,fd);
				close(fd);
				answer_body<<answer_body_string;
			}
	}
	else if(query_type == POST)
	{
		if(asking_file_name.length() > 0 && asking_file_name[0] == '/') asking_file_name.erase(0,1);
		is_succes_query = process_script(asking_file_name,result_position, buf, answer_body);

	}
	else if(query_type == ERROR)
	{
	
	}

	if(is_succes_query) answer_head << "HTTP/1.1 200 OK\r\n";
	else 
	{
		answer_head << "HTTP/1.1 404 Not Found\r\n";
		answer_body.clear();
	}
		answer_head << "Version: HTTP/1.1\r\n"
        	<< "Content-Type: text/html; charset=utf-8\r\n"
			//<< "Set-Cookie: id=10\r\n"
			<< "Content-Length: " << answer_body.str().length()
        	<< "\r\n\r\n";
       answer_full << answer_head.str()
       		<< answer_body.str();
}
