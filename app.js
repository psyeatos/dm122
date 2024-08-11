// Registro do Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
  .then(registration => {
      console.log('Service Worker registrado com sucesso:', registration);
  })
  .catch(error => {
      console.log('Falha ao registrar o Service Worker:', error);
  });
}

// Inicialização do IndexedDB
let db;
const request = indexedDB.open('pokemonDatabase', 1);

request.onerror = function(event) {
  console.log('Erro ao abrir o banco de dados:', event);
};

request.onsuccess = function(event) {
  db = event.target.result;
  console.log('Banco de dados aberto com sucesso:', db);
  displayPokemonList(); // Exibe a lista de Pokémon ao carregar a página
};

request.onupgradeneeded = function(event) {
  db = event.target.result;
  const objectStore = db.createObjectStore('pokemonStore', { keyPath: 'id', autoIncrement: true });
  objectStore.createIndex('name', 'name', { unique: false });
  objectStore.createIndex('type', 'type', { unique: false });
  objectStore.createIndex('level', 'level', { unique: false });
  console.log('Object Store de Pokémon criado com sucesso');
};

// Funções CRUD
function addPokemon(pokemon) {
  const transaction = db.transaction(['pokemonStore'], 'readwrite');
  const objectStore = transaction.objectStore('pokemonStore');
  const request = objectStore.add(pokemon);

  request.onsuccess = function(event) {
      console.log('Pokémon adicionado com sucesso:', event.target.result);
      displayPokemonList(); // Atualiza a lista de Pokémon
  };

  request.onerror = function(event) {
      console.log('Erro ao adicionar o Pokémon:', event.target.error);
  };
}

function displayPokemonList() {
  const pokemonList = document.getElementById('pokemonList');
  pokemonList.innerHTML = ''; // Limpa a lista antes de exibir

  const transaction = db.transaction(['pokemonStore'], 'readonly');
  const objectStore = transaction.objectStore('pokemonStore');

  objectStore.openCursor().onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor) {
          const listItem = document.createElement('div');
          listItem.className = 'pokemon-item';
          listItem.innerHTML = `
              <span>${cursor.value.name} (Tipo: ${cursor.value.type}, Nível: ${cursor.value.level})</span>
              <button class="action-button" onclick="deletePokemon(${cursor.value.id})">Deletar</button>
              <button class="action-button" onclick="editPokemon(${cursor.value.id})">Editar</button>
          `;
          pokemonList.appendChild(listItem);
          cursor.continue();
      } else {
          console.log('Todos os Pokémon foram exibidos.');
      }
  };
}

function deletePokemon(id) {
  const transaction = db.transaction(['pokemonStore'], 'readwrite');
  const objectStore = transaction.objectStore('pokemonStore');
  const request = objectStore.delete(id);

  request.onsuccess = function(event) {
      console.log('Pokémon deletado com sucesso:', event.target.result);
      displayPokemonList(); // Atualiza a lista de Pokémon
  };

  request.onerror = function(event) {
      console.log('Erro ao deletar o Pokémon:', event.target.error);
  };
}

// Captura os dados do formulário e adiciona um novo Pokémon
document.getElementById('pokemonForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const name = document.getElementById('pokemonName').value;
  const type = document.getElementById('pokemonType').value;
  const level = document.getElementById('pokemonLevel').value;
  addPokemon({ name, type, level });
  event.target.reset(); // Limpa o formulário
});

// Seleciona os elementos do modal
const modal = document.getElementById('editModal');
const closeButton = document.querySelector('.close-button');

// Função para abrir o modal e preencher os dados do Pokémon
function editPokemon(id) {
    const transaction = db.transaction(['pokemonStore'], 'readonly');
    const objectStore = transaction.objectStore('pokemonStore');
    const request = objectStore.get(id);

    request.onsuccess = function(event) {
        const pokemon = event.target.result;
        if (pokemon) {
            // Preenche o modal com os dados do Pokémon
            document.getElementById('editPokemonName').value = pokemon.name;
            document.getElementById('editPokemonType').value = pokemon.type;
            document.getElementById('editPokemonLevel').value = pokemon.level;

            // Exibe o modal
            modal.style.display = 'block';

            // Define o comportamento do formulário de edição
            document.getElementById('editForm').onsubmit = function(event) {
                event.preventDefault();
                updatePokemon(id); // Chama a função de atualização
            };
        } else {
            console.log('Pokémon não encontrado.');
        }
    };

    request.onerror = function(event) {
        console.log('Erro ao recuperar o Pokémon para edição:', event.target.error);
    };
}

// Função para atualizar o Pokémon
function updatePokemon(id) {
    const name = document.getElementById('editPokemonName').value;
    const type = document.getElementById('editPokemonType').value;
    const level = document.getElementById('editPokemonLevel').value;

    const transaction = db.transaction(['pokemonStore'], 'readwrite');
    const objectStore = transaction.objectStore('pokemonStore');
    const request = objectStore.put({ id, name, type, level });

    request.onsuccess = function(event) {
        console.log('Pokémon atualizado com sucesso:', event.target.result);
        displayPokemonList(); // Atualiza a lista de Pokémon
        closeModal(); // Fecha o modal após a atualização
    };

    request.onerror = function(event) {
        console.log('Erro ao atualizar o Pokémon:', event.target.error);
    };
}

// Função para fechar o modal
function closeModal() {
    modal.style.display = 'none';
}

// Fecha o modal quando o botão de fechar é clicado
closeButton.addEventListener('click', closeModal);

// Fecha o modal se o usuário clicar fora da área de conteúdo do modal
window.addEventListener('click', function(event) {
    if (event.target === modal) {
        closeModal();
    }
});
