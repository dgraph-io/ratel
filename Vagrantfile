# -*- mode: ruby -*-
# vi: set ft=ruby :

######
# Vagrant solution to quickly test Linux CI environment
# Instructions:
#  vagrant up && vagrant ssh
#  pushd ~/ratel/client/ && npm install --legacy-peer-deps && popd
#  cd ratel && make test
############
Vagrant.configure("2") do |config|
  config.vm.box = "generic/ubuntu2004"
  config.vm.hostname = "ratel.test"
  # use rsync to avoid mac vs linux node_modules and symlink issues
  config.vm.synced_folder ".", "/home/vagrant/ratel", type: "rsync",
    rsync__exclude: ["./client/node_modules"]

  # give some memory for npm install
  config.vm.provider "virtualbox" do |vbox|
    vbox.memory = 2048
    vbox.cpus = 2
  end

  # install docker, docker-compose, nodejs, puppeteer requirements
  config.vm.provision "shell", path: "./scripts/provision.sh"
  config.vm.provision "shell", inline: "usermod -aG docker vagrant"
end
